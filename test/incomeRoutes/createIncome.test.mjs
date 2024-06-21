import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import Income from '../../models/income/incomeModel.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';

describe('POST /api/income/createIncome', function () {
    this.timeout(10000);

    let user;
    let token;
    let account;
    let category;

    before(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Income.deleteMany({});

        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
        category = await IncomeCategory.create({ name: 'Test Category', userId: user._id });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Income.deleteMany({});
    });

    it('should create a new income and update account balance', async () => {
        const incomeData = {
            categoryId: category._id,
            amount: 500,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            accountId: account._id
        };

        const res = await request(app)
            .post('/api/income/createIncome')
            .set('Authorization', `Bearer ${token}`)
            .send(incomeData);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.have.property('amount', incomeData.amount);

        // Перевірка оновленого балансу рахунку
        const updatedAccount = await Account.findById(account._id);
        expect(updatedAccount).to.exist;
        expect(updatedAccount.balance).to.equal(1500); // Початковий баланс (1000) + дохід (500)
    });

    it('should return 404 if account not found', async () => {
        const incomeData = {
            categoryId: category._id,
            amount: 500,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            accountId: '000000000000000000000000'
        };

        const res = await request(app)
            .post('/api/income/createIncome')
            .set('Authorization', `Bearer ${token}`)
            .send(incomeData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Account not found');
    });

    it('should return 404 if category not found', async () => {
        const incomeData = {
            categoryId: '000000000000000000000000',
            amount: 500,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            accountId: account._id
        };

        const res = await request(app)
            .post('/api/income/createIncome')
            .set('Authorization', `Bearer ${token}`)
            .send(incomeData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Category not found');
    });

    it('should return an error if amount is not a number', async () => {
        const incomeData = {
            categoryId: category._id,
            amount: "j",
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            accountId: account._id
        };

        const res = await request(app)
            .post('/api/income/createIncome')
            .set('Authorization', `Bearer ${token}`)
            .send(incomeData);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Amount must be a positive number');
    });

});
