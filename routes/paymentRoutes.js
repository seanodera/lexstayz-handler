const express = require('express');
const {
    createTransaction,
    verifyTransaction,
    createRefund,
    createCharge, createPaystackRecipient,
} = require("../controller/paymentController");

const router = express.Router();

router.route('/payments/createTransaction').post(createTransaction);
router.route('/payments/verifyTransaction').post(verifyTransaction);
router.route('/payments/createRefund').post(createRefund);
router.route('/payments/createCharge').post(createCharge);
router.route('/payments/createPaystackRecipient').post(createPaystackRecipient)

module.exports = router;
