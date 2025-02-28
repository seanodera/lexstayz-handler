const express = require('express');
const { checkAdmin, checkAdminVerification, createAdmin, sendAdminInvite, processAdminInvite, activateAdmin } = require('../controller/authController');

const router = express.Router();

router.route('/auth').post(checkAdmin); // Define POST route for creating an admin

router.route('auth/confirm-code').post(checkAdminVerification); // Define POST route for admin login

router.route('/create').post(createAdmin); // Define POST route for admin logout (assuming you will implement this)

router.route('/invite/:id').post(sendAdminInvite).get(processAdminInvite); // Define POST route for activating admin account

router.route('/activate')
    .post(activateAdmin); // Define POST route for confirming admin email verification

module.exports = router
