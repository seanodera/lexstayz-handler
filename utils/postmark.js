const postmark = require("postmark");

// Initialize Postmark client
const client = new postmark.ServerClient(process.env.POSTMARK_EMAIL_KEY);

module.exports = client;
