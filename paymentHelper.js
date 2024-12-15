const axios = require("axios");
const process = require("node:process");
const { v4: uuidv4 } = require('uuid');
const countryData = require('country-data');


const convertCurrency = async (amount, currency) => {
    try {
        if (currency && currency !== 'GHS') {
            const ratesUrl = `https://open.er-api.com/v6/latest/${currency}`;
            const response = await axios.get(ratesUrl);
            const data = response.data;
            const exchangeRates = data.rates;
            if (!exchangeRates || !exchangeRates['GHS']) {
                throw new Error('Exchange rate for GHS not found');
            }
            return amount * exchangeRates['GHS'] * 1.035;
        } else {
            return amount;
        }
    } catch (e) {

        throw new Error(`Error getting exchange rates: ${e.message}`);
    }
};

exports.convertCurrency = convertCurrency;

exports.initiatePaystackPayment = async (email, amount,currency,callback_url,reference) => {
    let finalAmount;
    if (currency === 'KES' || currency === 'GHS') {
        finalAmount= amount;
    } else {
       finalAmount = await convertCurrency(amount, currency)
    }
    console.log(finalAmount);
    const secretKey = (currency === 'KES')? process.env.PAYSTACK_KE_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY
    const paymentUrl = `https://api.paystack.co/transaction/initialize`;
    const response = await axios.post(paymentUrl, {
        reference,
        amount: (finalAmount * 100).toFixed(0),
        email,
        callback_url,
    }, {
        headers: {
            Authorization: `Bearer ${secretKey}`
        }
    });
    return response.data;
}

function getISO3CountryName(countryName) {

    const country = countryData.countries.all.find(country => country.name.toLowerCase() === countryName.toLowerCase());

    if (country) {
        return country.alpha3;
    } else {
        return countryName;
    }
}
exports.getISO3CountryName = getISO3CountryName;

exports.initiatePowerPayment = async (email, amount,country,callback_url,reference, reason) => {
    const paymentUrl = `https://api.sandbox.pawapay.cloud/v1/widget/sessions`;
    const iso3CountryName = getISO3CountryName(country);


    const generatedUUID = uuidv4();
    console.log(`Generated UUID: ${generatedUUID}` , amount);
    const response = await axios.post(paymentUrl,{
        "depositId": generatedUUID,
        "returnUrl": `${callback_url}&reference=${reference}`,
        "amount": `${Math.round(amount)}`,
        "language": "EN",
        "country": iso3CountryName,
        "reason": reason,
    }, { headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`
        }})
    return {
        redirectUrl: response.data.redirectUrl,
        reference: generatedUUID,
    };
}


exports.updateBalance = async (userId) => {
    const events = await Event.find({eventHostId: userId}).exec();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset today's time to 00:00:00
    const user = await User.findById(userId).exec();
    for (const event of events) {
        let endDate;
        try {

            endDate = new Date(event.eventEnd);
        } catch (e) {

            const eventDate = new Date(event.eventDate);
            const [hours, minutes] = event.eventEnd.split(':');
            eventDate.setUTCHours(hours, minutes, 0, 0); // Set the time part
            endDate = eventDate;
        }

        if (isNaN(endDate)) {
            const eventDate = new Date(event.eventDate); // Event's date part
            const [hours, minutes] = event.eventEnd.split(':');
            eventDate.setUTCHours(hours, minutes, 0, 0); // Set the time part again
            endDate = eventDate; // Assign the complete date-time to endDate
        }

        if (today > endDate) {
            user.availableBalance += user.pendingBalance;
            user.pendingBalance = 0;
        }
        await user.save()
    }
}


exports.verifyPaystackPayment = async (reference) => {
    try {
        let secretKey = process.env.PAYSTACK_KE_SECRET_KEY;
        let response;

        // Attempt the first API call
        response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        });

        // Check if status is not 400
        if (response.status !== 400) {
            const data = response.data;
            let status, amountPaid;

            if (data.data.status === 'success') {
                status = 'COMPLETED';
                amountPaid = data.data.amount / 100;
            } else {
                status = 'FAILED';
            }
            return { status, amountPaid, method: 'PAYSTACK', data: data };
        } else {
            throw new Error('First key failed with status 400');
        }
    } catch (e) {
        // Retry with the alternate API key if the first attempt fails or returns a 400 status
        if (e.response && e.response.status === 400) {
            const errorData = e.response.data;
            if (errorData.data && errorData.data.code === 'transaction_not_found') {
                try {
                    const alternateSecretKey = process.env.PAYSTACK_SECRET_KEY;

                    const retryResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                        headers: {
                            Authorization: `Bearer ${alternateSecretKey}`,
                        },
                    });

                    const retryData = retryResponse.data;
                    let status, amountPaid;

                    if (retryData.data.status === 'success') {
                        status = 'COMPLETED';
                        amountPaid = retryData.data.amount / 100;
                    } else {
                        status = 'FAILED';
                    }
                    return {status, amountPaid, method: 'PAYSTACK_KE',data: retryData};

                } catch (retryError) {
                    console.error('Both API keys failed', retryError);
                }
            }
        }
    }
};

exports.completePawaPayPayout = async (amount,payout,account) => {
    try {
        const generatedUUID = uuidv4();
        const response = await axios.post('https://api.sandbox.pawapay.io/payouts', {
            payoutId: generatedUUID,
            amount: amount,
            currency: account.currency,
            correspondent: account.bankCode,
            recipient: {
                type: '',
                address: {value: account.accountNumber}
            },
            "customerTimestamp": new Date(payout.createdAt).toISOString(),
            "statementDescription": `Lexstayz Payout #${payout._id}`,
        }, {headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`
            }})

        return {
            transactionId: response.data.payoutId,
            status: response.data.status,
        }

    } catch (e) {
        throw new Error('failed to complete payout')
    }
}

exports.completePaystackPayout = async (amount,payout,account) => {
    try {
        const response = await axios.post('https://api.paystack.co/transfer',{
            source: 'balance',
            reason: `Lexstayz Payout #${payout._id}`,
            amount: amount * 100,
            recipient: account.recipient_code,
        })
        return {
            status: response.data.data.status,
            transactionId: response.data.data.transfer_code,
        }
    } catch (e) {
        throw new Error('failed to complete payout')
    }
}

exports.getConfigs = async () => {
    return await axios.get('https://api.sandbox.pawapay.cloud/active-conf', {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`
        }
    });
}

exports.createPaystackRecipient = async (userId,type, name,account_number,bank_code,currency) => {

    try {
        const secretKey = (currency === 'KES')? process.env.PAYSTACK_KE_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY
        const response = await axios.post('https://api.paystack.co/transferrecipient', {
            type: type,
            name: name,
            account_number: account_number,
            bank_code: bank_code,
            currency: currency,
            metadata: {
                userId: userId
            }
        }, {
            headers: {
                Authorization: `Bearer ${secretKey}`
            }
        });

        return response.data.data;
    } catch (error)  {
        console.log(error);
        throw new Error('User not created: ' + error.message);
    }
}
