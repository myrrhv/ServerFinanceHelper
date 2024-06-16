const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transferSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    fromAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    toAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});

const Transfer = mongoose.model('Transfer', transferSchema);

module.exports = Transfer;
