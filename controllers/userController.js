const User = require('../models/user/userModel');

const Income = require('../models/income/incomeModel');
const Expense = require('../models/expense/expenseModel');
const IncomeCategory = require('../models/income/incomeCategoryModel');
const ExpenseCategory = require('../models/expense/expenseCategoryModel');


exports.createUser = async (req, res) => {
    const { firebaseId } = req.body;
    if (!firebaseId) {
        return res.status(400).json({ error: 'firebaseId is required' });
    }

    try {
        const existingUser = await User.findOne({ _id: firebaseId });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Встановлюємо `_id` на значення `firebaseId`
        const newUser = new User({ _id: firebaseId});
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



exports.getAllTransactions = async (req, res) => {
    try {
        const month = req.params.month;
        const year = req.params.year;

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

        let amount_income = 0;
        incomes.forEach(income => {
            amount_income += income.amount;
            transactions.push({

                date: income.date.getDate(), // Число місяця
                dayOfWeek: income.date.getDay(), // День тижня
                category: income.categoryId.name,
                category: income.categoryId ? income.categoryId.name : 'Невідома категорія', // Назва категорії
                amount: income.amount, // Сума
                account: income.account ? income.account.name : 'Невідомий рахунок', // Назва рахунку
                accountId: income.account._id,
                note: income.note,
                type: 'income' // Тип транзакції
            });
        });

        let amount_expense = 0;
        expenses.forEach(expense => {
            amount_expense += expense.amount;
            transactions.push({
                date: expense.date.getDate(), // Число місяця
                dayOfWeek: expense.date.getDay(), // День тижня
                categoryId:expense.categoryId._id,
                category: expense.categoryId ? expense.categoryId.name : 'Невідома категорія', // Назва категорії
                amount: expense.amount, // Сума
                accountId: expense.account._id,
                account: expense.account ? expense.account.name : 'Невідомий рахунок', // Назва рахунку
                note: expense.note,
                type: 'expense' // Тип транзакції
                
            });
        });
        const total = amount_income - amount_expense;

        const response = {
            transactions: transactions,
            amount_income: amount_income,
            amount_expense: amount_expense,
            total: total
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};




exports.getAllMonthSummaries = async (req, res) => {
    const year = req.params.year;
    const userId = req.userId;


    try {
        const summaries = [];

        let yearIncomeTotal = 0;
        let yearExpenseTotal = 0;
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

                // Додати до загальних сум за рік
                yearIncomeTotal += incomes.length > 0 ? incomes[0].totalAmount : 0;
                yearExpenseTotal += expenses.length > 0 ? expenses[0].totalAmount : 0;
            }
        }
        const yearTotal = yearIncomeTotal -yearExpenseTotal;
        // Додати зведений звіт за весь рік
        const yearInfo = {
            yearIncomeTotal,
            yearExpenseTotal,
            yearTotal
        };
         res.status(200).json({
            yearInfo,
            arrayOfMonth: summaries
        });
    } catch (error) {
        console.error(error);
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
