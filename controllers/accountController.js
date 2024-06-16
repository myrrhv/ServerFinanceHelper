const Account = require('../models/account/accountModel');
const User = require('../models/user/userModel')
// Створення нового рахунку
exports.createAccount = async (req, res) => {
    try {
        const { name, balance } = req.body;
        const userId = req.userId;


        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const newAccount = await Account.create({
            name,
            balance,
            userId
        });

        res.status(201).json({
            status: 'success',
            data: newAccount
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating account'
        });
    }
};

// Редагування існуючого рахунку
exports.updateAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const { name, balance } = req.body;

        const updatedAccount = await Account.findByIdAndUpdate(accountId, { name, balance }, { new: true });

        if (!updatedAccount) {
            return res.status(404).json({
                status: 'error',
                message: 'Account not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: updatedAccount
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error updating account'
        });
    }
};

// Видалення рахунку
exports.deleteAccount = async (req, res) => {
    try {
        const accountId = req.params.id;

        const deletedAccount = await Account.findByIdAndDelete(accountId);

        if (!deletedAccount) {
            return res.status(404).json({
                status: 'error',
                message: 'Account not found'
            });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting account'
        });
    }
};

//стан рахунків користувача
exports.getUserBalances = async (req, res) => {
    try {
        const userId = req.userId;

        // Знайти всі рахунки користувача за firebaseId
        const accounts = await Account.find({ userId: userId  }, { _id: 1, name: 1, balance: 1 });

        res.status(200).json({
            status: 'success',
            data: accounts
        });
    } catch (error) {
        console.error('Error fetching user balances:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching user balances'
        });
    }
};
