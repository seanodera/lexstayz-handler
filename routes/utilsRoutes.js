const express = require("express");
const {generateICS, refreshFeaturedStays, getServerTime} = require("../controller/utilsController");
const router = express.Router();


router.route("/calendar/:hostId.ics").get(generateICS)
router.route('/utils/refresh').get(refreshFeaturedStays)
router.route('/utils/serverTime').all(getServerTime)
module.exports = router;
