const Transfer = require('../models/transfer/transferModel');
const Account = require('../models/account/accountModel');

exports.createTransfer = async (req, res) => {
    const userId = req.userId;
    const { amount, date, fromAccountId, toAccountId } = req.body;

    try {
        // Перевірка, чи заповнене поле amount
        if (amount === undefined || amount === null || amount <= 0) {
            return res.status(400).json({ status: 'error', message: 'Amount must be a positive number' });
        }
        // Перевірка наявності рахунків
        const fromAccount = await Account.findById(fromAccountId);
        if (!fromAccount) {
            return res.status(404).json({ message: "From account not found" });
        }

        const toAccount = await Account.findById(toAccountId);
        if (!toAccount) {
            return res.status(404).json({ message: "To account not found" });
        }

        // Перевірка балансу вихідного рахунку
        if (fromAccount.balance < amount) {
            return res.status(400).json({ message: "Insufficient funds in the from account" });
        }

        // Створення нового переказу
        const newTransfer = new Transfer({
            amount,
            date,
            fromAccountId,
            toAccountId,
            userId
        });

        // Збереження переказу
        await newTransfer.save();

        // Оновлення балансу рахунків
        fromAccount.balance -= amount;
        toAccount.balance += amount;
        await fromAccount.save();
        await toAccount.save();

        res.status(201).json(newTransfer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateTransfer = async (req, res) => {
    const { transferId } = req.params;
    const { amount, date, fromAccountId, toAccountId } = req.body;

    try {
        // Знайти переказ за його ідентифікатором
        const transfer = await Transfer.findById(transferId);
        if (!transfer) {
            return res.status(404).json({ message: "Transfer not found" });
        }

        // Знайти рахунки, які беруть участь у переказі
        let fromAccount = await Account.findById(transfer.fromAccountId);
        let toAccount = await Account.findById(transfer.toAccountId);

        // Зберегти попереднє значення amount, якщо нове значення не передане
        const previousAmount = transfer.amount;

        // Обробити обов'язкові поля
        if (amount !== undefined) {
            transfer.amount = amount;
        }
        if (date !== undefined) {
            transfer.date = date;
        }
        if (fromAccountId !== undefined && fromAccountId !== transfer.fromAccountId) {
            // Зміна вихідного рахунку
            // Повернути оригінальний баланс зміненого рахунку
            fromAccount.balance += previousAmount;
            // Знайти новий рахунок
            fromAccount = await Account.findById(fromAccountId);
            if (!fromAccount) {
                return res.status(404).json({ message: "From account not found" });
            }
            // Перевірити баланс вихідного рахунку
            if (fromAccount.balance < transfer.amount) {
                return res.status(400).json({ message: "Insufficient funds in the from account" });
            }
            fromAccount.balance -= transfer.amount;
            transfer.fromAccountId = fromAccountId;
        }
        if (toAccountId !== undefined && toAccountId !== transfer.toAccountId) {
            // Зміна вхідного рахунку
            // Повернути оригінальний баланс зміненого рахунку
            toAccount.balance -= previousAmount;
            // Знайти новий рахунок
            toAccount = await Account.findById(toAccountId);
            if (!toAccount) {
                return res.status(404).json({ message: "To account not found" });
            }
            toAccount.balance += transfer.amount;
            transfer.toAccountId = toAccountId;
        }

        // Зберегти оновлені рахунки
        await fromAccount.save();
        await toAccount.save();

        // Зберегти оновлений переказ
        await transfer.save();

        // Відповісти з успішним оновленням переказу
        res.status(200).json(transfer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.deleteTransfer = async (req, res) => {
    const { transferId } = req.params;

    try {
        // Знайти переказ за ID
        const transfer = await Transfer.findById(transferId);
        if (!transfer) {
            return res.status(404).json({ message: "Transfer not found" });
        }

        // Знайти рахунки за ID
        const fromAccount = await Account.findById(transfer.fromAccountId);
        if (!fromAccount) {
            return res.status(404).json({ message: "From account not found" });
        }

        const toAccount = await Account.findById(transfer.toAccountId);
        if (!toAccount) {
            return res.status(404).json({ message: "To account not found" });
        }

        // Оновлення балансів рахунків
        fromAccount.balance += transfer.amount;
        toAccount.balance -= transfer.amount;

        // Збереження оновлених рахунків
        await fromAccount.save();
        await toAccount.save();

        // Видалення переказу
        await Transfer.findByIdAndDelete(transferId);

        res.status(200).json({ message: "The transfer was successfully deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
