const express = require("express");
const {generateICS, refreshFeaturedStays} = require("../controller/utilsController");
const router = express.Router();


router.route("/calendar/:hostId.ics").get(generateICS)
router.route('/utils/refresh').get(refreshFeaturedStays)
module.exports = router;
