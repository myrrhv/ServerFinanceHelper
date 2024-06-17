const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});

accountSchema.index({ name: 1, userId: 1 }, { unique: true });
const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
