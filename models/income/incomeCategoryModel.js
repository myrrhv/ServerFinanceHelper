const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const incomeCategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});

const IncomeCategory = mongoose.model('IncomeCategory', incomeCategorySchema);

module.exports =IncomeCategory ;