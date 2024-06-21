import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import Expense from '../../models/expense/expenseModel.js';
import Income from '../../models/income/incomeModel.js';
import User from "../../models/user/userModel.js";
import generateToken from "../utils/generateToken.mjs";
import Account from "../../models/account/accountModel.js";

describe('DELETE /api/users/deleteCategory/:categoryId', function () {
    this.timeout(10000);
    let user, token;

    beforeEach(async () => {
        await ExpenseCategory.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Expense.deleteMany({});
        await Income.deleteMany({});
        await User.deleteMany({});
        await Account.deleteMany({});
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

    });

    it('should delete an expense category with no transactions in the current month', async () => {
        const expenseCategory = await ExpenseCategory.create({ name: 'Test Expense Category', userId: user._id });

        const res = await request(app)
            .delete(`/api/users/deleteCategory/${expenseCategory._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('message', 'Категорію успішно видалено');
        expect(res.body).to.have.property('type', 'expense');

        const deletedCategory = await ExpenseCategory.findById(expenseCategory._id);
        expect(deletedCategory).to.be.null;
    });

    it('should delete an income category with no transactions in the current month', async () => {
        const incomeCategory = await IncomeCategory.create({ name: 'Test Income Category',userId: user._id });

        const res = await request(app)
            .delete(`/api/users/deleteCategory/${incomeCategory._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('message', 'Категорію успішно видалено');
        expect(res.body).to.have.property('type', 'income');

        const deletedCategory = await IncomeCategory.findById(incomeCategory._id);
        expect(deletedCategory).to.be.null;
    });

    it('should return 400 if trying to delete an expense category with transactions in the current month', async () => {
        const expenseCategory = await ExpenseCategory.create({ name: 'Test Expense Category', userId: user._id });
        const account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
        await Expense.create({ categoryId: expenseCategory._id, account: account._id, amount: 100, userId: user._id  });

        const res = await request(app)
            .delete(`/api/users/deleteCategory/${expenseCategory._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Неможливо видалити категорію з наявними транзакціями в поточному місяці');

        const existingCategory = await ExpenseCategory.findById(expenseCategory._id);
        expect(existingCategory).to.exist;
    });

    it('should return 400 if trying to delete an income category with transactions in the current month', async () => {
        const incomeCategory = await IncomeCategory.create({ name: 'Test Income Category', userId: user._id });
        const account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
        await Income.create({ categoryId: incomeCategory._id, account: account._id, amount: 200, userId: user._id  });

        const res = await request(app)
            .delete(`/api/users/deleteCategory/${incomeCategory._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Неможливо видалити категорію з наявними транзакціями в поточному місяці');

        const existingCategory = await IncomeCategory.findById(incomeCategory._id);
        expect(existingCategory).to.exist;
    });


});
