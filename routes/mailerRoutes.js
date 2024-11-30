const express = require('express');
const {sendWelcomeMail, sendHostWelcomeMail, sendBookingNotificationMail, sendBookingStatusMail} = require("../controller/mailerController");
const router = express.Router();

router.route('/mailer/welcomeMail').post(sendWelcomeMail);
router.route('/mailer/welcomeHost').post(sendHostWelcomeMail);
router.route('/mailer/sendBookingStatus').post(sendBookingStatusMail);
router.route('/mailer/sendBookingNotificationMail').post(sendBookingNotificationMail);

module.exports = router;
