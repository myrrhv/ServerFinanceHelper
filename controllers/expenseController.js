const Expense = require('../models/expense/expenseModel');
const Account = require('../models/account/accountModel');
const ExpenseCategory = require('../models/expense/expenseCategoryModel');
const ExpenseCategoryLimit = require('../models/expense/expenseCategoryLimitModel');

exports.createExpense = async (req, res) => {
    const userId = req.userId;
    const { categoryId, account, amount, date, note } = req.body;
    
     // Перевірка наявності всіх обов'язкових полів
    if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required' });
    }
    if (!account) {
        return res.status(400).json({ message: 'Account is required' });
    }
    if (amount === undefined) {
        return res.status(400).json({ message: 'Amount is required' });
    }

    try {
        // Перевірка, чи заповнене поле amount
        if (amount === undefined || amount === null || amount <= 0 || isNaN(amount)) {
            return res.status(400).json({ status: 'error', message: 'Amount must be a positive number' });
        }
        
        // Перевірка наявності рахунку
        const scategory = await ExpenseCategory.findById(categoryId);
        if (!scategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        // Перевірка наявності рахунку
        const selectedAccount = await Account.findById(account);
        if (!selectedAccount) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Перевірка наявності ліміту категорії витрат
        const categoryLimit = await ExpenseCategoryLimit.findOne({ categoryId });


        // Перевірка балансу рахунку
        if (selectedAccount.balance < amount) {
            return res.status(400).json({ message: "Insufficient funds in the account" });
        }

        // Перевірка дати
        const currentDate = new Date();
        const minDate = new Date('2021-01-01');
        const expenseDate = new Date(date);

        if (isNaN(expenseDate.getTime())) {
            return res.status(400).json({ status: 'error', message: 'Invalid date format' });
        }
        if (expenseDate > currentDate) {
            return res.status(400).json({ status: 'error', message: 'Date cannot be in the future' });
        }
        if (expenseDate < minDate) {
            return res.status(400).json({ status: 'error', message: 'Date cannot be before 2021' });
        }

        // Створення нової витрати
        const newExpense = new Expense({
            userId,
            categoryId,
            account,
            amount,
            date,
            note
        });

        // Збереження витрати
        await newExpense.save();

        // Оновлення балансу рахунку
        selectedAccount.balance -= amount;
        await selectedAccount.save();

       // Якщо є ліміт для категорії, оновити поточну суму витрат
        if (categoryLimit) {
            categoryLimit.currentExpense += amount;
            await categoryLimit.save();
        }

        res.status(201).json(newExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateExpense = async (req, res) => {
    const { expenseId } = req.params;
    const { categoryId, date, note, amount, account } = req.body;

    try {
        // Знайти існуючу витрату
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const previousAmount = expense.amount;
        const amountDifference = amount - previousAmount;
        let oldAccount, newAccount;

        // Перевірка наявності старого рахунку, якщо змінюється рахунок або сума
        if (expense.account.toString() !== account || amount !== previousAmount) {
            oldAccount = await Account.findById(expense.account);
            if (!oldAccount) {
                return res.status(404).json({ message: "Old account not found" });
            }
        }

        // Перевірка наявності нового рахунку, якщо змінюється рахунок
        if (expense.account.toString() !== account) {
            newAccount = await Account.findById(account);
            if (!newAccount) {
                return res.status(404).json({ message: "New account not found" });
            }
        }

        // Перевірка наявності ліміту старої категорії витрат, якщо змінюється категорія або сума
        let oldCategoryLimit, newCategoryLimit;
        if (expense.categoryId.toString() !== categoryId || amount !== previousAmount) {
            oldCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: expense.categoryId });
        }

        // Перевірка наявності ліміту нової категорії витрат, якщо змінюється категорія
        if (expense.categoryId.toString() !== categoryId) {
            newCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId });
        }

        // Оновлення рахунків, якщо змінено рахунок або сума
        if (expense.account.toString() !== account) {
            oldAccount.balance += previousAmount;
            await oldAccount.save();

            if (newAccount.balance < amount) {
                return res.status(400).json({ message: "Insufficient funds in the new account" });
            }

            newAccount.balance -= amount;
            await newAccount.save();
        } else if (amount !== previousAmount) {
            if (oldAccount.balance < amountDifference) {
                return res.status(400).json({ message: "Insufficient funds in the account" });
            }

            oldAccount.balance -= amountDifference;
            await oldAccount.save();
        }

        // Оновлення лімітів категорій, якщо змінено категорію або суму
        if (expense.categoryId.toString() !== categoryId) {
            if (oldCategoryLimit) {
                oldCategoryLimit.currentExpense -= previousAmount;
                await oldCategoryLimit.save();
            }

            if (newCategoryLimit) {
                newCategoryLimit.currentExpense += amount;
                await newCategoryLimit.save();
            }
        } else if (amount !== previousAmount && oldCategoryLimit) {
            oldCategoryLimit.currentExpense += amountDifference;
            await oldCategoryLimit.save();
        }

        // Перевірка дати
        const currentDate = new Date();
        const minDate = new Date('2021-01-01');
        const expenseDate = new Date(date);

        if (isNaN(expenseDate.getTime())) {
            return res.status(400).json({ status: 'error', message: 'Invalid date format' });
        }
        if (expenseDate > currentDate) {
            return res.status(400).json({ status: 'error', message: 'Date cannot be in the future' });
        }
        if (expenseDate < minDate) {
            return res.status(400).json({ status: 'error', message: 'Date cannot be before 2021' });
        }

        // Оновлення витрати
        expense.categoryId = categoryId || expense.categoryId;
        expense.account = account || expense.account;
        expense.amount = amount || expense.amount;
        expense.date = date || expense.date;
        expense.note = note || expense.note;

        await expense.save();

        res.status(200).json(expense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};



exports.deleteExpense = async (req, res) => {
    const { expenseId } = req.params;

    try {
        // Знайти витрату
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // Знайти відповідний рахунок
        const selectedAccount = await Account.findById(expense.account);
        if (!selectedAccount) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Оновити баланс рахунку
        selectedAccount.balance += expense.amount;
        await selectedAccount.save();

        const categoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: expense.categoryId });

        // Якщо ліміт категорії існує, оновити поточну суму витрат у ліміті категорії
        if (categoryLimit) {
            categoryLimit.currentExpense -= expense.amount;
            await categoryLimit.save();
        }

        // Видалити витрату
        await Expense.deleteOne({ _id: expenseId });

        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
