import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import Income from '../../models/income/incomeModel.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';

describe('DELETE /api/income/deleteIncome/:incomeId', function () {
    this.timeout(10000);

    let user;
    let token;
    let account;
    let category;
    let income;

    before(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Income.deleteMany({});

        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
        category = await IncomeCategory.create({ name: 'Test Category', userId: user._id });
        income = await Income.create({
            userId: user._id,
            categoryId: category._id,
            amount: 500,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            account: account._id
        });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Income.deleteMany({});
    });

    it('should delete an income and adjust account balance', async () => {
        const res = await request(app)
            .delete(`/api/income/deleteIncome/${income._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body).to.have.property('message', 'Income deleted successfully');

        // Перевірка оновленого балансу рахунку
        const updatedAccount = await Account.findById(account._id);
        expect(updatedAccount).to.exist;
        expect(updatedAccount.balance).to.equal(500); // Початковий баланс (1000) - сума доходу (500)
    });

    it('should return 404 if income not found', async () => {
        const res = await request(app)
            .delete('/api/income/deleteIncome/000000000000000000000000') // Несуществующий ID
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Income not found');
    });

    it('should return 404 if account not found', async () => {
        const newIncome = await Income.create({
            userId: user._id,
            categoryId: category._id,
            amount: 800,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            account: account._id
        });
        // Видаляємо обліковий запис перед тестом
        await Account.findByIdAndDelete(account._id);

        const res = await request(app)
            .delete(`/api/income/deleteIncome/${newIncome._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Account not found');
    });

});