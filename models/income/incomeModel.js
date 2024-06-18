const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const incomeSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IncomeCategory',
        required: true
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },

    note: {
        type: String,
        required: false
    }
});

const Income = mongoose.model('Income', incomeSchema);
module.exports = Income;
