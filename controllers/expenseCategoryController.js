const ExpenseCategory = require('../models/expense/expenseCategoryModel');

exports.addExpenseCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.userId;

        const newCategory = new ExpenseCategory({ name, userId });
        await newCategory.save();

        res.status(201).json({
            status: 'success',
            data: newCategory
        });
    } catch (error) {
        console.error('Error adding expense category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error adding expense category'
        });
    }
};


exports.editExpenseCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body;

        const category = await ExpenseCategory.findByIdAndUpdate(categoryId, { name }, { new: true });

        if (!category) {
            return res.status(404).json({ status: 'error', message: 'Expense category not found' });
        }

        res.status(200).json({
            status: 'success',
            data: category
        });
    } catch (error) {
        console.error('Error editing expense category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error editing expense category'
        });
    }
};