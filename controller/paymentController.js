const axios = require("axios");
const {isAxiosError, post} = require("axios");
const {initiatePowerPayment, initiatePaystackPayment, verifyPaystackPayment, createPaystackRecipient} = require("../paymentHelper");

const pawapayHost = process.env.STAGE === 'dev'? 'https://api.sandbox.pawapay.io':'https://api.pawapay.io';

// Create Transaction
exports.createTransaction = async (req, res) => {
    const {email, amount, currency, reference, callback_url, country, booking,purpose} = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        return res.status(500).json({status: 'error', message: 'Paystack secret key not found'});
    }

    console.log(req.body);
    try {
        let authorization_url;
        let method;
        let paymentReference;
        let reason;
        if(purpose){
            reason = purpose;
        } else if (booking){
            reason = `Stay at ${booking.stay.name}`
        } else {
            reason = 'lexstays services'
        }
        if (currency === 'KES') {
            const response = await initiatePaystackPayment(email, amount, currency, callback_url+ `&method=Paystack_KE`, reference);
            authorization_url = response.data.authorization_url ;
            paymentReference = response.data.reference;
            method = 'Paystack_KE'
        } else if (currency !== 'GHS') {
            const response = await initiatePowerPayment(email, amount, country, callback_url + `&method=Pawapay`, reference, reason);
            authorization_url = response.redirectUrl;
            paymentReference = response.reference;
            method = 'Pawapay'
        } else {
            const response = await initiatePaystackPayment(email, amount, currency, callback_url + `&method=Paystack`, reference);
            authorization_url = response.data.authorization_url ;
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

        let status = 'PENDING';
        let amountPaid = 0;
        let data;
        let finalMethod = method
        if (method === 'Paystack' || method === 'Paystack_KE') {

            const response = await verifyPaystackPayment(reference, method)
            status = response.status
            amountPaid = response.amountPaid
            finalMethod = response.method
            data = response.data
        } else {
            const response = await axios.get(`https://api.sandbox.pawapay.cloud/deposits/${reference}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`
                }
            })
            const deposit = response.data[0];
            data = deposit;
            if (response.data.length === 0) {
                status = 'FAILED';
            } else {
                finalMethod = 'PAWAPAY'
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
                    reference, method: finalMethod, data
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

    const token = process.env.PAWAPAY_BEARER_TOKEN;

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
        } else if (method === 'Paystack' || method === 'Paystack_KE') {
            const secretKey = (method === 'Paystack_KE')? process.env.PAYSTACK_KE_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY
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


exports.getPawapayConfigs = async (req, res) => {
    try {
        const response = await axios.get(`${pawapayHost}/active-conf`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`
            }
        });

        const data = response.data.countries

        return res.status(200).json({
            data: data,
            success: true,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message});
    }
}




exports.createWithdrawalAccount = async (req, res) => {
    const {userId, type, name, accountNumber, bankCode, currency, bankName} = req.body;
    try {
        let withdrawalAccount;

            if (currency === 'GHS' || currency === 'KES') {
                const recipient = await createPaystackRecipient(userId, type, name, accountNumber, bankCode, currency);
                if (recipient) {
                    console.log(recipient)
                    withdrawalAccount = {
                        type: recipient.type,
                        name: name,
                        accountNumber: accountNumber,
                        bankCode: bankCode,
                        bankName: bankName,
                        currency: currency,
                        recipient_code: recipient.recipient_code,
                        service: 'Paystack'
                    };
                }
            } else {
                withdrawalAccount = {
                    userId: userId,
                    type: 'MSISDN',
                    name: name,
                    accountNumber: accountNumber,
                    currency: currency,
                    bankCode: bankCode,
                    service: 'Pawapay'
                };
            }
            console.log(withdrawalAccount);
            return res.status(200).json({
                status: 'success',
                data: withdrawalAccount
            })
    } catch (error){
        console.log(error)
        return res.status(500).json({error: error.message});
    }
}

