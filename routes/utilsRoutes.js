const express = require("express");
const {generateICS} = require("../controller/utilsController");
const router = express.Router();


router.route("/calendar/:hostId.ics").get(generateICS)
module.exports = router;
