const admin = require("firebase-admin");

const fs = require("fs");
const handlebars = require("handlebars");
const juice = require("juice");
const {defineSecret} = require("firebase-functions/params");
const {
  onDocumentCreated, onDocumentUpdated,
} = require("firebase-functions/firestore");

const compileTemplateWithTailwind = (templatePath, cssPath, variables) => {
  // Read the HTML template
  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const template = handlebars.compile(templateSource);
  const htmlContent = template(variables); // Insert dynamic variables

  // Read the compiled Tailwind CSS file
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  return juice.inlineContent(htmlContent, cssContent);
};

const postmark = require("postmark");

const postmarkApiKeySecret = defineSecret('POSTMARK_API_KEY');
// const postmarkApiKey = functions.config().postmark.api_key;


const db = admin.firestore();

const cssLocation = "./templates/tailwind_output.css";

exports.sendWelcomeMail = onDocumentCreated("/users", {
  secrets: [postmarkApiKeySecret],
}, async (event) => {
  try {
    const userData = event.data.data();

    const htmlContent = compileTemplateWithTailwind(
        "./templates/welcome_email.html",
        cssLocation, // Path to compiled Tailwind CSS
        {
          name: userData.firstName + " " + userData.lastName,
          email: userData.email,
        });
    const postmarkApiKey = postmarkApiKeySecret.value();
    const postmarkClient= new postmark.ServerClient(postmarkApiKey);
    await postmarkClient.sendEmail({
      From: "thelexstayzteam@fadorteclimited.com",
      To: userData.email,
      Subject: "Welcome to Our Booking Platform",
      HtmlBody: htmlContent,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
});

exports.sendHostWelcomeMail = onDocumentCreated("/hosts",
    {
      secrets: [postmarkApiKeySecret],
    }, async (event) => {
      try {
        const userData = event.data.data();

        const htmlContent = compileTemplateWithTailwind(
            "./templates/welcome_email.html",
            cssLocation,
            {
              name: userData.firstName + " " + userData.lastName,
              email: userData.email,
            });
        const postmarkApiKey = postmarkApiKeySecret.value();
        const postmarkClient= new postmark.ServerClient(postmarkApiKey);
        // Send the email using Postmark (or any other service)
        await postmarkClient.sendEmail({
          From: "thelexstayzteam@fadorteclimited.com",
          To: userData.email,
          Subject: "Welcome to Our Booking Platform",
          HtmlBody: htmlContent,
        });
      } catch (error) {
        console.error("Error sending welcome email:", error);
      }
    });

exports.sendBookingStatusMail = onDocumentUpdated("/bookings",
    {
      secrets: [postmarkApiKeySecret],
    },
    async (event) => {
      try {
        const newBooking = event.data.after.data();
        const oldBooking = event.data.before.data();
        const name = newBooking.user.firstName + " " + newBooking.user.lastName;

        const postmarkApiKey = postmarkApiKeySecret.value();
        const postmarkClient= new postmark.ServerClient(postmarkApiKey);

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
      } catch (error) {
        console.log(error);
      }
    });

exports.sendBookingNotificationMail = onDocumentCreated("/bookings",
    {
      secrets: [postmarkApiKeySecret],
    },
    async (event) => {
      try {
        const booking = event.data.data();
        const htmlContent = compileTemplateWithTailwind(
            "./templates/booking_notification_email.html",
            cssLocation,
            {customerName: booking.user.email});

        const hostDocRef = db
            .collection(`/hosts/${booking.hostId}`)
            .doc("anotherDocumentId");
        const hostDocSnapshot = await hostDocRef.get();

        const postmarkApiKey = postmarkApiKeySecret.value();
        const postmarkClient= new postmark.ServerClient(postmarkApiKey);

        if (hostDocSnapshot.exists) {
          const hostDocumentData = hostDocSnapshot.data();

          await postmarkClient.sendEmail({
            From: " thelexstayzteam@fadorteclimited.com",
            To: hostDocumentData.email,
            Subject: "New Booking Notification",
            HtmlBody: htmlContent,
          });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.log(error);
      }
    });
