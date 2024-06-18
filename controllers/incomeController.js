const Income = require('../models/income/incomeModel');
const Account = require('../models/account/accountModel');
const IncomeCategory = require('../models/income/incomeCategoryModel');

exports.createIncome = async (req, res) => {
    const userId = req.userId;

    try {
        const { categoryId, amount, date, accountId, note} = req.body;

        // Перевірка, чи існує обліковий запис
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Account not found' });
        }

        // Перевірка, чи існує категорія
        const category = await IncomeCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: 'error', message: 'Category not found' });
        }

        // Додаємо суму доходу до балансу облікового запису
        account.balance += amount;

        // Зберігаємо оновлений баланс облікового запису
        await account.save();

        // Створюємо новий дохід
        const newIncome = await Income.create({
            userId,
            categoryId,
            account: accountId,
            amount,
            date,
            note
        });

        res.status(201).json({
            status: 'success',
            data: newIncome
        });
    } catch (error) {
        console.error('Error creating income:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating income'
        });
    }
};


exports.updateIncome = async (req, res) => {
    try {
        const { incomeId } = req.params;
        const { categoryId, amount, account, date, note } = req.body;

        // Перевірка, чи існує дохід
        let income = await Income.findById(incomeId);
        if (!income) {
            return res.status(404).json({ status: 'error', message: 'Income not found' });
        }

        // Перевірка, чи існує категорія
        if (categoryId) {
            const category = await IncomeCategory.findById(categoryId);
            if (!category) {
                return res.status(404).json({ status: 'error', message: 'Category not found' });
            }
            income.categoryId = categoryId;
        }
        // Перевірка наявності рахунку
        const selectedAccount = await Account.findById(account);
        if (!selectedAccount) {
            return res.status(404).json({status: 'error', message: "Account not found" });
        }

        // Отримання попередньої суми доходу і ідентифікатора облікового запису
        const previousAmount = income.amount;
        const previousAccountId = income.account;

        // Перевірка, чи змінився рахунок
        if (account !== previousAccountId.toString()) {
            // Отримання старого та нового рахунків
            const oldAccount = await Account.findById(previousAccountId);
            const newAccount = await Account.findById(account);

            // Перевірка наявності нового рахунку
            if (!newAccount) {
                return res.status(404).json({ status: 'error', message: 'New account not found' });
            }

            // Віднімання попередньої суми зі старого рахунку
            oldAccount.balance -= previousAmount;
            await oldAccount.save();

            // Додавання нової суми до нового рахунку
            newAccount.balance += amount;
            await newAccount.save();

            // Оновлення accountId в доході
            income.account = account;
        } else {
            // Якщо рахунок не змінився, просто виправити баланс
            const account = await Account.findById(previousAccountId);
            account.balance += previousAmount - amount;
            await account.save();
        }

        // Оновлення інших полів доходу
        income.amount = amount;
        if (date) income.date = date;
        if (note) income.note = note;

        // Збереження оновленого доходу
        await income.save();

        res.status(200).json({
            status: 'success',
            data: income
        });
    } catch (error) {
        console.error('Error updating income:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating income'
        });
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        const { incomeId } = req.params;

        // Перевірка, чи існує дохід
        const income = await Income.findById(incomeId);
        if (!income) {
            return res.status(404).json({ status: 'error', message: 'Income not found' });
        }

        // Отримання ідентифікатора облікового запису
        const accountId = income.account;

        // Перевірка, чи існує обліковий запис
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Account not found' });
        }

        // Віднімання суми доходу з балансу облікового запису
        account.balance -= income.amount;

        // Збереження оновленого балансу облікового запису
        await account.save();

        // Видалення доходу з бази даних
        await Income.findByIdAndDelete(incomeId);

        res.status(200).json({
            status: 'success',
            message: 'Income deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting income:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting income'
        });
    }
};
