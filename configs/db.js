const mongoose = require('mongoose');
require('colors');
const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'lexstayz', // Ensure connection to the correct database
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
    } catch (err) {
        console.log(err)
        console.error(`MongoDB Connection Error: ${err.message}`.red);
        process.exit(1);
    }
};

module.exports = connectDB;
