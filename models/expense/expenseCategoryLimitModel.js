const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Схема для ліміту категорій витрат
const expenseCategoryLimitSchema = new Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        required: true
    },
    limit: {
        type: Number,
        required: true
    },
    currentExpense: {
        type: Number,
        default: 0
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    }
});

const ExpenseCategoryLimit = mongoose.model('ExpenseCategoryLimit', expenseCategoryLimitSchema);

module.exports = ExpenseCategoryLimit;
