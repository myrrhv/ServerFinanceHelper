const IncomeCategory = require('../models/income/incomeCategoryModel');
const Income = require('../models/income/incomeModel');

exports.createIncomeCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const userId = req.userId;

        // Перевірка кількості категорій доходів
        const incomeCategoryCount = await IncomeCategory.countDocuments({ userId });

        if (incomeCategoryCount >= 15) {
            return res.status(400).json({ status: 'error', message: 'User has reached the limit of 15 categories' });
        }

        const lowerCaseName = name.toLowerCase();

        //const existingCategory = await IncomeCategory.findOne({ lowerCaseName, userId });
        const existingCategory = await IncomeCategory.findOne({ name: lowerCaseName, userId }).collation({ locale: 'en', strength: 2 });
        if (existingCategory) {
            return res.status(400).json({
                status: 'error',
                message: 'Category already exists'
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
        // Перевіряємо, чи існує категорія з таким же ім'ям для поточного користувача
        const existingCategory = await IncomeCategory.findOne({ name: name.toLowerCase(), userId }).collation({ locale: 'en', strength: 2 });
        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            return res.status(400).json({ status: 'error', message: 'Category already exists' });
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

exports.getCategories = async (req, res) => {
    try {
        const userId = req.userId;

        const month = req.params.month;
        const year = req.params.year;
        const numericMonth = parseInt(month, 10) - 1;

        const categories = await Income.aggregate([
            {
                $match: {
                    userId: userId,
                    date: {
                        $gte: new Date(year, numericMonth, 1),
                        $lt: new Date(year, numericMonth + 1, 1)
                    }
                }
            },
            {
                $lookup: {
                    from: 'incomecategories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $group: {
                    _id: '$categoryId',
                    name: { $first: '$category.name' }
                }
            },
            {
                $project: {
                    _id: 0,
                    categoryId: '$_id',
                    name: 1
                }
            }
        ]);

        const data = categories || [];

        res.status(200).json({
            status: 'success',
            data: data
        });
    } catch (error) {
        console.error('Error fetching income categories for current month:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching income categories for current month'
        });
    }
};
