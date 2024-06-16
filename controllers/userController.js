const User = require('../models/user/userModel');

const Income = require('../models/income/incomeModel');
const Expense = require('../models/expense/expenseModel');
const IncomeCategory = require('../models/income/incomeCategoryModel');
const ExpenseCategory = require('../models/expense/expenseCategoryModel');
const ExpenseCategoryLimit = require('../models/expense/expenseCategoryLimitModel');
const Account = require('../models/account/accountModel');


exports.createUser = async (req, res) => {
    const { firebaseId } = req.body;
    if (!firebaseId) {
        return res.status(400).json({ error: 'firebaseId is required' });
    }

    try {
        const existingUser = await User.findOne({ firebaseId });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Встановлюємо `_id` на значення `firebaseId`
        const newUser = new User({ _id: firebaseId, firebaseId });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



exports.getAllTransactions = async (req, res) => {
    try {
        const month = req.body.month; // Місяць, який передається в параметрах
        const year = new Date().getFullYear(); // Поточний рік
        const userId = req.userId;


        // Отримати всі доходи за вказаний місяць і рік для конкретного користувача
        const incomes = await Income.find({
            userId: userId,
            date: {
                $gte: new Date(year, month - 1, 1), // Початок місяця
                $lte: new Date(year, month - 1, 31) // Кінець місяця (максимум 31 день)
            }
        }).populate('categoryId', 'name').populate('account', 'name');

        // Отримати всі витрати за вказаний місяць і рік для конкретного користувача
        const expenses = await Expense.find({
            userId: userId,
            date: {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month - 1, 31) // Кінець місяця
            }
        }).populate('categoryId', 'name').populate('account', 'name');
        const transactions = [];
        incomes.forEach(income => {
            transactions.push({
                date: income.date.getDate(), // Число місяця
                dayOfWeek: income.date.getDay(), // День тижня
                category: income.categoryId ? income.categoryId.name : 'Невідома категорія', // Назва категорії
                amount: income.amount, // Сума
                account: income.account ? income.account.name : 'Невідомий рахунок', // Назва рахунку
                type: 'income' // Тип транзакції
            });
        });

        expenses.forEach(expense => {
            transactions.push({
                date: expense.date.getDate(), // Число місяця
                dayOfWeek: expense.date.getDay(), // День тижня
                category: expense.categoryId ? expense.categoryId.name : 'Невідома категорія', // Назва категорії
                amount: expense.amount, // Сума
                account: expense.account ? expense.account.name : 'Невідомий рахунок', // Назва рахунку
                type: 'expense' // Тип транзакції
            });
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};




exports.getAllMonthSummaries = async (req, res) => {
    const { year } = req.body;
    const userId = req.userId;


    try {
        const summaries = [];

        // Цикл по місяцях (1 - січень, 12 - грудень)
        for (let month = 1; month <= 12; month++) {
            // Отримати всі доходи для поточного місяця і року
            const incomes = await Income.aggregate([
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
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            // Отримати всі витрати для поточного місяця і року
            const expenses = await Expense.aggregate([
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
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            // Якщо є витрати або доходи у поточному місяці, додати їх до зведеного звіту
            if (incomes.length > 0 || expenses.length > 0) {
                summaries.push({
                    month,
                    incomeTotal: incomes.length > 0 ? incomes[0].totalAmount : 0,
                    expenseTotal: expenses.length > 0 ? expenses[0].totalAmount : 0
                });
            }
        }

        res.status(200).json(summaries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};


exports.getAllCategories = async (req, res) => {
    const { month } = req.body;
    const userId = req.userId;


    try {
        // Отримати всі категорії витрат для поточного користувача
        const expenseCategories = await ExpenseCategory.find({ userId });

        // Отримати ліміти категорій витрат для вказаного місяця та userId
        const categoryLimits = await ExpenseCategoryLimit.find({ month, categoryId: { $in: expenseCategories.map(cat => cat._id) } })
            .populate({
                path: 'categoryId',
                select: 'name'
            })
            .exec();

        console.log("Отримано ліміти категорій витрат:", categoryLimits);

        // Перевірка наявності результатів
        if (!categoryLimits || categoryLimits.length === 0) {
            return res.status(404).json({ message: "Ліміти категорій витрат не знайдено" });
        }

        // Підготувати відповідь з поточними витратами та лімітами категорій
        const response = categoryLimits.map(categoryLimit => ({
            categoryId: categoryLimit.categoryId._id,
            categoryName: categoryLimit.categoryId.name,
            currentExpense: categoryLimit.currentExpense,
            limit: categoryLimit.limit,
            percentageSpent: (categoryLimit.currentExpense / categoryLimit.limit) * 100
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error("Помилка при отриманні категорій витрат:", error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};


exports.deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    console.log(categoryId);

    try {
        // Перевіряємо, чи є категорія в розділі витрат
        let categoryModel = ExpenseCategory;
        let transactionModel = Expense;

        // Шукаємо категорію в розділі доходів, якщо не знайдено в розділі витрат
        let categoryType = 'expense';
        const expenseCategory = await ExpenseCategory.findById(categoryId);
        if (!expenseCategory) {
            categoryModel = IncomeCategory;
            transactionModel = Income;
            categoryType = 'income';
        }

        // Перевірка наявності транзакцій в поточному місяці для обраної категорії
        const transactionsCount = await transactionModel.countDocuments({
            categoryId: categoryId,
            date: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59)
            }
        });

        // Якщо є транзакції, неможливо видалити категорію
        if (transactionsCount > 0) {
            return res.status(400).json({ message: "Неможливо видалити категорію з наявними транзакціями в поточному місяці" });
        }

        // Видалення категорії
        await categoryModel.findByIdAndDelete(categoryId);

        res.status(200).json({ message: "Категорію успішно видалено", type: categoryType });
    } catch (error) {
        console.error("Помилка при видаленні категорії:", error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};