const express = require('express');
const {
    createTransaction,
    verifyTransaction,
    createRefund,
    createCharge, getPaystackBanks, createWithdrawalAccount, getPawapayConfigs,
} = require("../controller/paymentController");

const router = express.Router();

router.route('/payments/createTransaction').post(createTransaction);
router.route('/payments/verifyTransaction').post(verifyTransaction);
router.route('/payments/createRefund').post(createRefund);
router.route('/payments/createCharge').post(createCharge);
router.route('/payments/banks').get(getPaystackBanks);
router.route('/payments/configs').get(getPawapayConfigs);
router.route('/payments/createWithdrawalAccount').post(createWithdrawalAccount);

module.exports = router;
