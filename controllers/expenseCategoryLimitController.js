const ExpenseCategoryLimit = require('../models/expense/expenseCategoryLimitModel');
const ExpenseCategory = require('../models/expense/expenseCategoryModel');

exports.createExpenseCategoryLimit = async (req, res) => {
    try {
        const { categoryId, limit } = req.body;

        // Перевірка, чи існує категорія витрат
        const category = await ExpenseCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: 'error', message: 'Category not found' });
        }

        // Отримання поточного місяця та року
        const now = new Date();
        const month = now.getMonth() + 1; // getMonth() повертає місяць від 0 до 11
        const year = now.getFullYear();

        // Перевірка, чи вже існує ліміт для даної категорії в поточному місяці та році
        const existingLimit = await ExpenseCategoryLimit.findOne({ categoryId, month, year });
        if (existingLimit) {
            return res.status(400).json({ status: 'error', message: 'Limit already exists for this category in the current month and year' });
        }

        // Створення нового ліміту для категорії витрат
        const newLimit = new ExpenseCategoryLimit({
            categoryId,
            limit,
            month,
            year
        });

        await newLimit.save();

        res.status(201).json({
            status: 'success',
            data: newLimit
        });
    } catch (error) {
        console.error('Error creating expense category limit:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating expense category limit'
        });
    }
};

exports.updateExpenseCategoryLimit = async (req, res) => {
    try {
        const { limitId } = req.params;
        const { categoryId, limit, month, year } = req.body;

        // Перевірка, чи існує ліміт
        let expenseCategoryLimit = await ExpenseCategoryLimit.findById(limitId);
        if (!expenseCategoryLimit) {
            return res.status(404).json({ status: 'error', message: 'Expense category limit not found' });
        }

        // Перевірка, чи існує категорія витрат
        if (categoryId) {
            const category = await ExpenseCategory.findById(categoryId);
            if (!category) {
                return res.status(404).json({ status: 'error', message: 'Category not found' });
            }
            expenseCategoryLimit.categoryId = categoryId;
        }

        // Оновлення полів ліміту
        if (limit !== undefined) expenseCategoryLimit.limit = limit;
        if (month !== undefined) expenseCategoryLimit.month = month;
        if (year !== undefined) expenseCategoryLimit.year = year;

        // Збереження оновленого ліміту
        await expenseCategoryLimit.save();

        res.status(200).json({
            status: 'success',
            data: expenseCategoryLimit
        });
    } catch (error) {
        console.error('Error updating expense category limit:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating expense category limit'
        });
    }
};


exports.deleteExpenseCategoryLimit = async (req, res) => {
    try {
        const { limitId } = req.params;

        // Перевірка, чи існує ліміт
        const expenseCategoryLimit = await ExpenseCategoryLimit.findById(limitId);
        if (!expenseCategoryLimit) {
            return res.status(404).json({ status: 'error', message: 'Expense category limit not found' });
        }

        // Видалення ліміту з бази даних
        await ExpenseCategoryLimit.findByIdAndDelete(limitId);

        res.status(200).json({
            status: 'success',
            message: 'Expense category limit deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting expense category limit:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting expense category limit'
        });
    }
};
