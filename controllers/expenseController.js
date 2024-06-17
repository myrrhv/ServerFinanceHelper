const Expense = require('../models/expense/expenseModel');
const Account = require('../models/account/accountModel')
const ExpenseCategoryLimit = require('../models/expense/expenseCategoryLimitModel');

exports.createExpense = async (req, res) => {
    const userId = req.userId;
    const { categoryId, account, amount, date, note } = req.body;

    try {
        // Перевірка наявності рахунку
        const selectedAccount = await Account.findById(account);
        if (!selectedAccount) {
            return res.status(404).json({ message: "Рахунок не знайдено" });
        }

        // Перевірка наявності ліміту категорії витрат
        const categoryLimit = await ExpenseCategoryLimit.findOne({ categoryId });
        if (!categoryLimit) {
            return res.status(404).json({ message: "Ліміт категорії витрат не знайдено" });
        }

        // Перевірка балансу рахунку
        if (selectedAccount.balance < amount) {
            return res.status(400).json({ message: "Недостатньо коштів на рахунку" });
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

        // Оновлення поточної суми витрат у ліміті категорії
        categoryLimit.currentExpense += amount;
        await categoryLimit.save();

        res.status(201).json(newExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};

exports.updateExpense = async (req, res) => {
    const { expenseId } = req.params;
    const { categoryId, date, note, amount, account } = req.body;

    try {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Витрата не знайдена" });
        }

        const oldAccount = await Account.findById(expense.account);
        if (!oldAccount) {
            return res.status(404).json({ message: "Старий рахунок не знайдено" });
        }

        let newAccount = oldAccount;
        if (account && account.toString() !== oldAccount._id.toString()) {
            newAccount = await Account.findById(account);
            if (!newAccount) {
                return res.status(404).json({ message: "Новий рахунок не знайдено" });
            }
        }

        let categoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: expense.categoryId });
        if (!categoryLimit) {
            return res.status(404).json({ message: "Ліміт категорії витрат не знайдено" });
        }

        if (categoryId && categoryId.toString() !== expense.categoryId.toString()) {
            categoryLimit.currentExpense -= expense.amount;

            let newCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId });
            if (newCategoryLimit) {
                newCategoryLimit.currentExpense += amount !== undefined ? amount : expense.amount;
                await newCategoryLimit.save();
                categoryLimit = newCategoryLimit;
            }
        }

        const oldAmount = expense.amount;
        const newAmount = amount !== undefined ? amount : oldAmount;
        const changeInAmount = newAmount - oldAmount;

        if (newAccount._id.toString() === oldAccount._id.toString()) {
            if (changeInAmount !== 0 && newAccount.balance < changeInAmount) {
                return res.status(400).json({ message: "Недостатньо коштів на рахунку" });
            }
        } else {
            if (newAccount.balance < newAmount) {
                return res.status(400).json({ message: "Недостатньо коштів на новому рахунку" });
            }
        }

        expense.categoryId = categoryId || expense.categoryId;
        expense.date = date || expense.date;
        expense.note = note || expense.note;
        expense.amount = newAmount;
        expense.account = newAccount._id;

        await expense.save();

        if (newAccount._id.toString() === oldAccount._id.toString()) {
            if (changeInAmount !== 0) {
                oldAccount.balance -= changeInAmount;
                await oldAccount.save();
            }
        } else {
            oldAccount.balance += oldAmount;
            newAccount.balance -= newAmount;
            await oldAccount.save();
            await newAccount.save();
        }

        categoryLimit.currentExpense += changeInAmount;
        await categoryLimit.save();

        res.json(expense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};


exports.deleteExpense = async (req, res) => {
    const { expenseId } = req.params;

    try {
        // Знайти витрату
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Витрата не знайдена" });
        }

        // Знайти відповідний рахунок
        const selectedAccount = await Account.findById(expense.account);
        if (!selectedAccount) {
            return res.status(404).json({ message: "Рахунок не знайдено" });
        }

        // Знайти відповідний ліміт категорії витрат
        const categoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: expense.categoryId });
        if (!categoryLimit) {
            return res.status(404).json({ message: "Ліміт категорії витрат не знайдено" });
        }

        // Оновити баланс рахунку
        selectedAccount.balance += expense.amount;
        await selectedAccount.save();

        // Оновити поточну суму витрат у ліміті категорії
        categoryLimit.currentExpense -= expense.amount;
        await categoryLimit.save();

        // Видалити витрату
        await Expense.deleteOne({ _id: expenseId });

        res.json({ message: "Витрата успішно видалена" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};
