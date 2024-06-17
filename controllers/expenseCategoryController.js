const ExpenseCategory = require('../models/expense/expenseCategoryModel');
const ExpenseCategoryLimit = require("../models/expense/expenseCategoryLimitModel");

exports.addExpenseCategory = async (req, res) => {
    try {
        const { name, limit } = req.body;
        const userId = req.userId;

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
        const { categoryId } = req.params;
        const { name, limit } = req.body;

        const category = await ExpenseCategory.findByIdAndUpdate(categoryId, { name }, { new: true });

        if (!category) {
            return res.status(404).json({ status: 'error', message: 'Expense category not found' });
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
    const userId = req.userId;

    const month = req.params.month;
    const year = req.params.year;

    try {
        // Отримати всі категорії витрат для поточного користувача
        const expenseCategories = await ExpenseCategory.find({ userId });

        // Перевірка наявності результатів
        if (!expenseCategories || expenseCategories.length === 0) {
            // Якщо немає катгорій, повертаємо порожній масив
            return res.status(200).json([]);
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
        // Перевірка наявності результатів
        if (!categoryLimits || categoryLimits.length === 0) {
            // Якщо немає лімітів, повертаємо порожній масив
            return res.status(200).json([]);
        }


        const response = expenseCategories.map(category => {
            // Знайти ліміт для поточної категорії, якщо він є
            const limitInfo = categoryLimits.find(limit => limit.categoryId.equals(category._id));

            if (limitInfo) {
                return {
                    categoryId: limitInfo.categoryId._id,
                    categoryName: limitInfo.categoryId.name,
                    currentExpense: limitInfo.currentExpense,
                    limit: limitInfo.limit,
                    percentageSpent: (limitInfo.currentExpense / limitInfo.limit) * 100
                };
            } else {
                // Якщо немає ліміту для категорії, повертаємо лише ідентифікатор та назву категорії
                return {
                    categoryId: category._id,
                    categoryName: category.name
                };
            }
        });

        res.status(200).json(response);
    } catch (error) {
        console.error("Помилка при отриманні категорій витрат:", error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};

