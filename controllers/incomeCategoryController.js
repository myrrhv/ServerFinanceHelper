const IncomeCategory = require('../models/income/incomeCategoryModel');

exports.createIncomeCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const userId = req.userId;

        const lowerCaseName = name.toLowerCase();

        //const existingCategory = await IncomeCategory.findOne({ lowerCaseName, userId });
        const existingCategory = await IncomeCategory.findOne({ name: lowerCaseName, userId }).collation({ locale: 'en', strength: 2 });
        if (existingCategory) {
            return res.status(400).json({
                status: 'error',
                message: 'Категорія уже існує'
            });
        }

        // Створюємо нову категорію доходу
        const newIncomeCategory = new IncomeCategory({ name, userId });
        await newIncomeCategory.save();

        res.status(201).json({
            status: 'success',
            data: newIncomeCategory
        });
    } catch (error) {
        console.error('Error adding income category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error adding income category'
        });
    }
};

exports.editIncomeCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        console.log(categoryId);
        const { name } = req.body;

        // Знаходимо категорію доходу за її ID
        const incomeCategory = await IncomeCategory.findById(categoryId);
        if (!incomeCategory) {
            return res.status(404).json({ status: 'error', message: 'Income category not found' });
        }

        // Оновлюємо дані категорії
        incomeCategory.name = name;
        await incomeCategory.save();

        res.status(200).json({
            status: 'success',
            data: incomeCategory
        });
    } catch (error) {
        console.error('Error editing income category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error editing income category'
        });
    }
};