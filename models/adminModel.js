const mongoose = require('mongoose');
const {Schema} = mongoose;

const adminSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    activated: {
        type: Boolean,
        default: false
    },
    username: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        default: 'admin',
    },
    image: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('Admin', adminSchema);
