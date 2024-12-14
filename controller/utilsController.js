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
