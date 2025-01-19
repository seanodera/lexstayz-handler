const {firestore} = require("../utils/firebase");

function formatDate(date) {
    console.log(date);
    const dateStr = new Date(date);
    // Set the seconds and milliseconds to 0
    dateStr.setSeconds(0);
    dateStr.setMilliseconds(0);
    //
    const dateISO = dateStr.toISOString()
    return dateISO.replace(/[-:]/g, "").split(".")[0] + "Z";
}

async function generateICSForHost(hostId) {
    try {
        // Fetch bookings for the specific host from Firebase
        const bookingsSnapshot = await firestore
            .collection("bookings")
            .where("hostId", "==", hostId)
            .where('isConfirmed', '==', true)
            .where('checkInDate', '>=', new Date().toISOString())
            .get();
        console.log(bookingsSnapshot.size)
        if (bookingsSnapshot.empty) {
            return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Platform Name//NONSGML v1.0//EN
END:VCALENDAR
    `;
        }

        let stays = []
        let resolved = []

        for (let doc of bookingsSnapshot.docs) {
            const booking = doc.data();

            const stayDoc = await firestore.collection("stays").doc(booking.accommodationId).get();
            let stay = stays.find((value) => value.id === booking.accommodationId);
            if (!stay) {
                stay = stayDoc.data()
                stays.push(stay)
            }
            resolved.push(`
BEGIN:VEVENT
UID:${doc.id}@lexstayz.com
DTSTAMP:${formatDate(booking.acceptedAt || new Date())}
DTSTART:${formatDate(booking.checkInDate)}
DTEND:${formatDate(booking.checkOutDate)}
SUMMARY:Guest at ${stay.name}
DESCRIPTION:${booking.description || "No description provided"}
LOCATION:${stay.location.fullAddress || "No location provided"}
STATUS:${booking.status === 'Confirmed' ? 'CONFIRMED' : 'CANCELLED'}
TRANSP:TRANSPARENT
END:VEVENT`)
        }
        const events = resolved.join("");

        return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LexStayz//Booking Management System 1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;
    } catch (error) {
        console.log(error);
    }
}

exports.generateICS = async function (req, res) {
    const {hostId} = req.params;

    try {
        console.log(hostId);
        const icsContent = await generateICSForHost(hostId);

        console.log(icsContent);
        res.setHeader("Content-Type", "text/calendar");
        res.send(icsContent);
    } catch (error) {
        console.error("Error generating iCalendar:", error);
        res.status(500).send("Internal Server Error");
    }
}

exports.refreshFeaturedStays = async (req, res) => {
    const today = new Date().toISOString();

    try {
        // STEP 1: Move adverts to featured collection if startDate is today or earlier
        const advertSnapshot = await firestore.collection('adverts').where('startDate', '<=', today).get();

        if (!advertSnapshot.empty) {
            const moveToFeaturedPromises = [];
            advertSnapshot.forEach((doc) => {
                const advertData = doc.data();
                const advertId = doc.id;

                // Add to Featured Collection
                moveToFeaturedPromises.push(firestore.collection('featured').doc(advertId).set(advertData).then(() => {
                    // Remove from Adverts
                    return firestore.collection('adverts').doc(advertId).delete();
                }));
            });

            await Promise.all(moveToFeaturedPromises);
            console.log('Moved adverts to featured collection successfully!');
        }

        // STEP 2: Move featured adverts to pastAdverts collection if endDate has passed
        const featuredSnapshot = await firestore.collection('featured').where('endDate', '<', today).get();

        if (!featuredSnapshot.empty) {
            const moveToPastAdvertsPromises = [];
            featuredSnapshot.forEach((doc) => {
                const featuredData = doc.data();
                const featuredId = doc.id;

                // Add to PastAdverts Collection
                moveToPastAdvertsPromises.push(firestore.collection('pastAdverts').doc(featuredId).set(featuredData).then(() => {
                    // Remove from Featured
                    return firestore.collection('featured').doc(featuredId).delete();
                }));
            });

            await Promise.all(moveToPastAdvertsPromises);
            console.log('Moved featured adverts to pastAdverts collection successfully!');
        }
        res.status(200).send({
            message: 'Featured adverts Moved successfully!',
        })
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
}

exports.getServerTime = async (req, res) => {
    try {
        const date = new Date();

        // Calculate UTC offset in hours and minutes
        const utcOffsetMinutes = date.getTimezoneOffset();
        const offsetSign = utcOffsetMinutes > 0 ? "-" : "+";
        const absoluteOffsetMinutes = Math.abs(utcOffsetMinutes);
        const utcOffset = `${offsetSign}${String(Math.floor(absoluteOffsetMinutes / 60)).padStart(2, "0")}:${String(absoluteOffsetMinutes % 60).padStart(2, "0")}:00`;

        // Determine if it's daylight savings time
        const isDayLightSavingsTime = new Date().getTimezoneOffset() < Math.max(
            new Date(date.getFullYear(), 0).getTimezoneOffset(),
            new Date(date.getFullYear(), 6).getTimezoneOffset()
        );

        // Map days of the week
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfTheWeek = daysOfWeek[date.getUTCDay()];

        // Current file time: number of 100-nanosecond intervals since January 1, 1601 (Windows file time)
        const epochTicks = 621355968000000000; // Ticks from 1601 to Unix epoch (1970)
        const currentFileTime = epochTicks + date.getTime() * 10000;

        return res.status(200).send({
            currentDateTime: date.toUTCString(),
            isoDateTime: date.toISOString(),
            utcOffset: utcOffset,
            isDayLightSavingsTime: isDayLightSavingsTime,
            dayOfTheWeek: dayOfTheWeek,
            timeZoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
            currentFileTime: currentFileTime,
            ordinalDate: `${date.getFullYear()}-${Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24))}`,
        });
    } catch (error) {
        console.error("Error fetching server time:", error);
        return  res.status(500).send("Internal Server Error");
    }
};
