const ExpenseCategory = require('../models/expense/expenseCategoryModel');
const ExpenseCategoryLimit = require("../models/expense/expenseCategoryLimitModel");
const Expense = require("../models/expense/expenseModel");

exports.addExpenseCategory = async (req, res) => {
    try {
        const { name, limit } = req.body;
        const userId = req.userId;
        
        // Перевірка на пустоту назви категорії
        if (!name || name.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'Category name cannot be empty' });
        }

        // Перевірка кількості категорій доходів
        const expenseCategoryCount = await ExpenseCategory.countDocuments({ userId });

        if (expenseCategoryCount >= 15) {
            return res.status(400).json({ status: 'error', message: 'User has reached the limit of 15 categories' });
        }

        const lowerCaseName = name.toLowerCase();

        const existingCategory = await ExpenseCategory.findOne({ name: lowerCaseName, userId }).collation({ locale: 'en', strength: 2 });
        if (existingCategory) {
            return res.status(400).json({
                status: 'error',
                message: 'Категорія уже існує'
            });
        }
        const newCategory = new ExpenseCategory({ name, userId });
        await newCategory.save();


        // Якщо ліміт присутній, створюємо відповідний запис у ExpenseCategoryLimit
        if (limit !== undefined) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // Місяці в JavaScript 0-індексовані
            const currentYear = currentDate.getFullYear();

            const newCategoryLimit = new ExpenseCategoryLimit({
                categoryId: newCategory._id,
                limit,
                month: currentMonth,
                year: currentYear
            });
            await newCategoryLimit.save();
        }

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
        const userId = req.userId;
        const { categoryId } = req.params;
        const { name, limit } = req.body;

        // Перевірка на пустоту назви категорії
        if (!name || name.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'Category name cannot be empty' });
        }

        const category = await ExpenseCategory.findByIdAndUpdate(categoryId, { name }, { new: true });

        if (!category) {
            return res.status(404).json({ status: 'error', message: 'Expense category not found' });
        }

        // Перевіряємо, чи існує категорія з таким же ім'ям для поточного користувача
        const existingCategory = await ExpenseCategory.findOne({ name: name.toLowerCase(), userId }).collation({ locale: 'en', strength: 2 });
        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            return res.status(400).json({ status: 'error', message: 'Category already exists' });
        }

        // Якщо передано ліміт, перевіряємо чи існує ліміт для цієї категорії
        if (limit !== undefined) {
            const categoryLimit = await ExpenseCategoryLimit.findOne({ categoryId });

            if (categoryLimit) {
                // Якщо ліміт існує, оновлюємо його
                categoryLimit.limit = limit;
                await categoryLimit.save();
            } else {
                // Якщо ліміт не існує, створюємо новий запис
                const newCategoryLimit = new ExpenseCategoryLimit({
                    categoryId,
                    limit,
                    currentExpense: 0 // Початкове значення для нових лімітів
                });
                await newCategoryLimit.save();
            }
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

exports.getAllCategories = async (req, res) => {
    try {
        const userId = req.userId;
        const categories = await ExpenseCategory.find({ userId: userId });

        res.status(200).json({
            status: 'success',
            data: categories
        });
    } catch (error) {
        console.error('Error fetching income categories for user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching income categories for user'
        });
    }
};

exports.getAllCategoriesByDate = async (req, res) => {
    const userId = req.userId;
    
    const month = req.params.month;
    const year = req.params.year;

    try {
        // Отримати всі категорії витрат для поточного користувача
        const expenseCategories = await ExpenseCategory.find({ userId });

        // Перевірка наявності результатів
        if (!expenseCategories || expenseCategories.length === 0) {
            // Якщо немає катгорій, повертаємо порожній масив
            return res.status(200).json({
                categoriesWithLimits: [],
                categoriesWithoutLimits: [],
                categoriesWithNoExpenses: []
            });
        }

        // Отримати ліміти категорій витрат для вказаного місяця та userId
        const categoryLimits = await ExpenseCategoryLimit.find({ month, year, categoryId: { $in: expenseCategories.map(cat => cat._id) } })
            .populate({
                path: 'categoryId',
                select: 'name'
            })
            .exec();

        console.log("Отримано ліміти категорій витрат:", categoryLimits);

        console.log(categoryLimits);
        

        // Отримати поточні витрати для кожної категорії для вказаного місяця та року
        const currentExpenses = await Expense.aggregate([
            {
                $match: {
                    userId,
                    date: {
                        $gte: new Date(year, month - 1, 1),
                        $lt: new Date(year, month, 0)
                    }
                }
            },
            {
                $group: {
                    _id: "$categoryId",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        const expenseMap = new Map();
        currentExpenses.forEach(expense => {
            expenseMap.set(expense._id.toString(), expense.totalAmount);
        });

        let categoriesWithLimits = [];
        let categoriesWithoutLimits = [];
        let categoriesWithNoExpenses = [];

        expenseCategories.forEach(category => {
            const categoryIdStr = category._id.toString();
            const currentExpense = expenseMap.get(categoryIdStr) || 0;
            const limitInfo = categoryLimits.find(limit => limit.categoryId.equals(category._id));

            if (limitInfo) {
                categoriesWithLimits.push({
                    categoryId: limitInfo.categoryId._id,
                    categoryName: limitInfo.categoryId.name,
                    currentExpense: currentExpense,
                    limit: limitInfo.limit,
                    percentageSpent: (currentExpense / limitInfo.limit) * 100
                });
            } else if (currentExpense > 0) {
                categoriesWithoutLimits.push({
                    categoryId: category._id,
                    categoryName: category.name,
                    currentExpense: currentExpense
                });
            } else {
                categoriesWithNoExpenses.push({
                    categoryId: category._id,
                    categoryName: category.name
                });
            }
        });

        const response = {
            categoriesWithLimits: categoriesWithLimits,
            categoriesWithoutLimits: categoriesWithoutLimits,
            categoriesWithNoExpenses: categoriesWithNoExpenses
        };

        // Send the response
        res.status(200).json(response);
    } catch (error) {
        console.error("Помилка при отриманні категорій витрат:", error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};
