// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local' });
const path = require('path');
const app = express();
app.use(express.json());
app.use(cors());
const connectDB = require("./configs/db");
connectDB();

const payments = require('./routes/paymentRoutes')
const mailers = require('./routes/mailerRoutes')
const utils = require('./routes/utilsRoutes');
const admin = require('./routes/authRoutes')

app.use('/api',payments)
app.use('/api',mailers)
app.use('/api',utils)
app.use('/api/admin', admin)

app.get('/api/hello-lexstayz', (req, res) => {
    res.send('Hello Lexstayz!');
});


// Start the Express server
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
