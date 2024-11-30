const axios = require("axios");
const {isAxiosError, post} = require("axios");
const {initiatePowerPayment, initiatePaystackPayment} = require("../paymentHelper");
const process = require("node:process");


// Create Transaction
exports.createTransaction = async (req, res) => {
    const {email, amount, currency, reference, callback_url, country, booking} = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        return res.status(500).json({status: 'error', message: 'Paystack secret key not found'});
    }
    console.log(req.body);
    try {
        let authorization_url;
        let method;
        let paymentReference;
        if (currency !== 'GHS') {
            const response = await initiatePowerPayment(email, amount, country, callback_url, reference, `Stay at ${booking.stay.name}`);
            authorization_url = response.redirectUrl;
            paymentReference = response.reference;
            method = 'Pawapay'
        } else {
            const response = await initiatePaystackPayment(email, amount, currency, callback_url, reference);
            authorization_url = response.data.authorization_url;
            paymentReference = response.data.reference;
            method = 'Paystack'
        }


        return res.status(200).json({
            status: 'success', data: {
                authorization_url, reference: paymentReference, access_code: paymentReference, method
            }
        });

    } catch (error) {
        console.error('Paystack transaction initialization error:', error, 'Params', email, amount, currency, reference, callback_url);
        return res.status(500).json({status: 'error', message: 'Server error'});
    }
};

// Verify Transaction
exports.verifyTransaction = async (req, res) => {
    const {reference, method} = req.body;


    try {
        console.log(req.body)
        let status = 'PENDING';
        let amountPaid = 0;
        let data;
        if (method === 'Paystack') {
            const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            });
            data = response.data
            if (response.data.data.status === 'success') {
                status = 'COMPLETED';
                amountPaid = response.data.data.amount / 100

            } else {
                status = 'FAILED';
            }
        } else {
            const response = await axios.get(`https://api.sandbox.pawapay.cloud/deposits/${reference}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`
                }
            })
            console.log(response.data)
            const deposit = response.data[0];
            data = deposit;
            if (response.data.length === 0) {
                status = 'FAILED';
            } else {
                if (deposit.status === "ACCEPTED" || deposit.status === "COMPLETED") {
                    status = 'COMPLETED';
                    amountPaid = deposit.depositedAmount;
                } else if (deposit.status === "SUBMITTED") {
                    status = 'PENDING'
                    amountPaid = deposit.requestedAmount;
                } else if (deposit.status === "FAILED") {
                    status = 'FAILED'
                }
            }
        }

        if (status === 'COMPLETED') {
            return res.status(200).json({
                status: 'success', data: {
                    reference, method, data
                }
            });
        } else {
            return res.status(400).json({status: 'error', message: 'Transaction verification failed'});
        }
    } catch (error) {
        console.error(' transaction verification error:', error);
        return res.status(500).json({status: 'error', message: 'Server error'});
    }
};

// Create Refund
exports.createRefund = async (req, res) => {
    const {reference, amount, method, refundId, depositId} = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const token = process.env.PAWAPAY_BEARER_TOKEN; // Ensure to store your bearer token in an environment variable

    if (!secretKey) {
        return res.status(500).json({status: 'error', message: 'Paystack secret key not found'});
    }

    if (!token) {
        return res.status(500).json({status: 'error', message: 'Pawapay token not found'});
    }

    try {
        if (method === 'Pawapay') {
            const response = await axios.post('https://api.sandbox.pawapay.io/refunds', {
                refundId,
                depositId,
                amount: `${amount && Math.round(amount)}`
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.data) {
                return res.status(200).json({status: 'success', data: response.data});
            } else {
                return res.status(400).json({status: 'error', message: 'Refund creation failed'});
            }
        } else if (method === 'Paystack') {
            const response = await axios.post('https://api.paystack.co/refund', {
                transaction: reference,
                amount
            }, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                },
            });

            if (response.data.status) {
                return res.status(200).json({status: 'success', data: response.data});
            } else {
                return res.status(400).json({status: 'error', message: 'Refund creation failed'});
            }
        }
    } catch (error) {
        console.error('Refund error:', error);
        return res.status(500).json({status: 'error', message: 'Server error'});
    }
};

// Create Charge
exports.createCharge = async (req, res) => {
    const {email, amount, reference, authorization_code} = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        return res.status(500).json({status: 'error', message: 'Paystack secret key not found'});
    }

    try {
        const response = await post(
            'https://api.paystack.co/transaction/charge_authorization',
            {
                email,
                amount: amount * 100, // Convert to kobo
                reference,
                authorization_code
            }, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                },
            }
        );

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Paystack charge error:', error);
        if (isAxiosError(error)) {
            return res.status(error.response?.status || 500).json(
                {status: 'error', message: error.response?.data.message || 'Unknown error from Paystack'}
            );
        }
        return res.status(500).json({status: 'error', message: 'Server error'});
    }
};

exports.getPaystackBanks = async (req, res) => {
    try {
        const response = await axios.get(`https://api.paystack.co/bank`, {
            params: {currency: req.query.currency},
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        return res.status(200).json({
            success: true,
            data: response.data.data,
        });
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}
