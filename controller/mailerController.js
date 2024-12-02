const postmarkClient = require("../utils/postmark");
const {compileTemplateWithTailwind} = require("../helper");


const cssLocation = "./templates/tailwind_output.css";

exports.sendWelcomeMail =  async (req,res) => {
    try {

        const {userData} = req.body;

        const htmlContent = compileTemplateWithTailwind(
            "./templates/welcome_email.html",
            cssLocation, // Path to compiled Tailwind CSS
            {
                name: userData.firstName + " " + userData.lastName,
                email: userData.email,
            });

        await postmarkClient.sendEmail({
            From: "thelexstayzteam@fadorteclimited.com",
            To: userData.email,
            Subject: "Welcome to Our Booking Platform",
            HtmlBody: htmlContent,
        });
        res.status(200).send({
            success: true,
            message: 'Mail Sent Successfully'
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
        console.error("Error sending welcome email:", error);
    }
};

exports.sendHostWelcomeMail = async (req,res) => {
        try {
            const {userData} = req.body;

            const htmlContent = compileTemplateWithTailwind(
                "./templates/welcome_email.html",
                cssLocation,
                {
                    name: userData.firstName + " " + userData.lastName,
                    email: userData.email,
                });
            await postmarkClient.sendEmail({
                From: "thelexstayzteam@fadorteclimited.com",
                To: userData.email,
                Subject: "Welcome to Our Booking Platform",
                HtmlBody: htmlContent,
            });
            res.status(200).send({
                success: true,
                message: 'Mail Sent Successfully'
            })
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
            console.error("Error sending welcome email:", error);
        }
    };

exports.sendBookingStatusMail =  async (req,res) => {
        try {
            const {newBooking,oldBooking} = req.body;
            const name = newBooking.user.firstName + " " + newBooking.user.lastName;
            if (newBooking.status !== oldBooking.status) {
                if (newBooking.status === "Refund") {
                    const htmlContent = compileTemplateWithTailwind(
                        "./templates/refund_email.html",
                        cssLocation, {
                            name: name,
                            refundAmount: newBooking.grandTotal,
                        });
                    await postmarkClient.sendEmail({
                        From: "thelexstayzteam@fadorteclimited.com",
                        To: newBooking.user.email,
                        Subject: "Refund Processed",
                        HtmlBody: htmlContent,
                    });
                } else if (newBooking.status === "Cancellation") {
                    const htmlContent = compileTemplateWithTailwind(
                        "./templates/cancellation_email.html",
                        cssLocation, {
                            name: name,
                            bookingId: newBooking.id.split(0, 8).toUpperCase(),
                        });

                    await postmarkClient.sendEmail({
                        From: "thelexstayzteam@fadorteclimited.com",
                        To: newBooking.user.email,
                        Subject: "Booking Cancellation",
                        HtmlBody: htmlContent,
                    });
                } else {
                    const htmlContent = compileTemplateWithTailwind(
                        "./templates/booking_status_email.html",
                        cssLocation, {
                            name: name,
                            status: newBooking.status,
                        });

                    await postmarkClient.sendEmail({
                        From: "thelexstayzteam@fadorteclimited.com",
                        To: newBooking.user.email,
                        Subject: "Booking Status Update",
                        HtmlBody: htmlContent,
                    });
                }
            }
            res.status(200).send({
                success: true,
                message: 'Mail Sent Successfully'
            })
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
            console.log(error);
        }
    };

exports.sendBookingNotificationMail = async (req,res) => {
        try {
            const {userEmail, hostEmail} =req.body;
            const htmlContent = compileTemplateWithTailwind(
                "./templates/booking_notification_email.html",
                cssLocation,
                {customerName: userEmail});


                await postmarkClient.sendEmail({
                    From: "thelexstayzteam@fadorteclimited.com",
                    To: hostEmail,
                    Subject: "New Booking Notification",
                    HtmlBody: htmlContent,
                });

            res.status(200).send({
                success: true,
                message: 'Mail Sent Successfully'
            })
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
            console.log(error);
        }
    };
