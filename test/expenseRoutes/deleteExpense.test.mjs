import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import Expense from '../../models/expense/expenseModel.js';
import ExpenseCategoryLimit from '../../models/expense/expenseCategoryLimitModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';
import ExpenseCategory from "../../models/expense/expenseCategoryModel.js";

describe('DELETE /api/expense/deleteExpense/:expenseId', function () {
    this.timeout(10000);

    let user;
    let token;
    let account;
    let expense;
    let category;
    let categoryLimit;

    before(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Expense.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});

        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });

        category = await ExpenseCategory.create({ name: 'Test Category', userId: user._id });

        categoryLimit = await ExpenseCategoryLimit.create({ categoryId: category._id, limit: 500, currentExpense: 100,month: 6,
            year: 2024 });
        expense = await Expense.create({ categoryId: category._id, amount: 100, account: account._id, userId: user._id });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Expense.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});
    });

    it('should delete an expense and update account balance and category limit', async () => {
        const res = await request(app)
            .delete(`/api/expense/deleteExpense/${expense._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('message', 'Expense deleted successfully');

        // Перевірка оновленого балансу рахунку
        const updatedAccount = await Account.findById(account._id);
        expect(updatedAccount).to.exist;
        expect(updatedAccount.balance).to.equal(1100); // Початковий баланс (1000) + витрата (100)

        // Перевірка оновленого ліміту категорії
        const updatedCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: expense.categoryId });
        expect(updatedCategoryLimit).to.exist;
        expect(updatedCategoryLimit.currentExpense).to.equal(0); // Початковий ліміт (100) - витрата (100)
    });

    it('should return 404 if expense not found', async () => {
        const res = await request(app)
            .delete('/api/expense/deleteExpense/000000000000000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'Expense not found');
    });



});
