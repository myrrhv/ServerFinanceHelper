import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import Income from '../../models/income/incomeModel.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';


describe('PUT /api/income/updateIncome/:id', function () {
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

        // Оновлення балансу рахунку з урахуванням створеного доходу
        account.balance += income.amount;
        await account.save();
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Income.deleteMany({});
    });

    
    it('should return 404 if income not found', async () => {
        const updatedIncomeData = {
            categoryId: category._id,
            amount: 800,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            note: 'Updated note'
        };

        const res = await request(app)
            .put('/api/income/updateIncome/000000000000000000000000') // Несуществующий ID
            .set('Authorization', `Bearer ${token}`)
            .send(updatedIncomeData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Income not found');
    });

    it('should return 404 if category not found', async () => {
        const updatedIncomeData = {
            categoryId: '000000000000000000000000', // Несуществующий ID
            amount: 800,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            note: 'Updated note'
        };

        const res = await request(app)
            .put(`/api/income/updateIncome/${income._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedIncomeData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Category not found');
    });

    it('should return 404 if account not found', async () => {
        const updatedIncomeData = {
            categoryId: category._id,
            amount: 800,
            date: new Date(),
            isDefault: false,
            recurringDate: null,
            note: 'Updated note'
        };

        // Видалення облікового запису перед тестом
        await Account.findByIdAndDelete(account._id);

        const res = await request(app)
            .put(`/api/income/updateIncome/${income._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedIncomeData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Account not found');
    });
});
