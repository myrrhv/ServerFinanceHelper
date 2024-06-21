import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';
import Account from '../../models/account/accountModel.js'; // Модель рахунку
import ExpenseCategoryLimit from '../../models/expense/expenseCategoryLimitModel.js';


describe('POST /api/expense/createExpense', function () {
    this.timeout(10000);
    let user;
    let token;
    let category;
    let account;
    let categoryLimit;

    before(async () => {
        // Створюємо тестового користувача
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        // Створюємо тестову категорію витрат
        category = await ExpenseCategory.create({ name: 'Test Category', userId: user._id });

        // Створюємо тестовий рахунок
        account = await Account.create({ name:"Card1", balance: 2000, userId: user._id }); // Припустимо, що рахунок має початковий баланс 2000

        // Створюємо тестовий ліміт для категорії витрат
        categoryLimit = await ExpenseCategoryLimit.create({
            categoryId: category._id,
            limit: 1000,
            currentExpense: 0,
            month: 6,
            year: 2024
        });
    });

    after(async () => {
        // Після завершення тестів, очищаємо дані користувача, категорії витрат, рахунку і лімітів категорій витрат
        await User.deleteMany({});
        await ExpenseCategory.deleteMany({});
        await Account.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});

    });

    it('should create a new expense and update account balance and category limit', async () => {
        const newExpenseData = {
            categoryId: category._id,
            account: account._id,
            amount: 500,
            date: new Date(),
            note: 'Test expense'
        };

        const res = await request(app)
            .post('/api/expense/createExpense')
            .set('Authorization', `Bearer ${token}`)
            .send(newExpenseData);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('userId', user._id);
        expect(res.body).to.have.property('categoryId', category._id.toString());
        expect(res.body).to.have.property('account', account._id.toString());
        expect(res.body).to.have.property('amount', newExpenseData.amount);
        expect(new Date(res.body.date)).to.eql(new Date(newExpenseData.date));
        expect(res.body).to.have.property('note', newExpenseData.note);

        // Перевірка оновлення балансу рахунку
        const updatedAccount = await Account.findById(account._id);
        expect(updatedAccount.balance).to.equal(1500); // Початковий баланс 2000 - 500 (витрата) = 1500

        // Перевірка оновлення ліміту категорії витрат (якщо він є)
        const updatedCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: category._id });
        expect(updatedCategoryLimit).to.exist;
        expect(updatedCategoryLimit.currentExpense).to.equal(newExpenseData.amount);
    });

    it('should return an error if account balance is insufficient', async () => {
        const newExpenseData = {
            categoryId: category._id,
            account: account._id,
            amount: 2500, // Більше, ніж баланс рахунку (2000)
            date: new Date(),
            note: 'Test expense with insufficient balance'
        };

        const res = await request(app)
            .post('/api/expense/createExpense')
            .set('Authorization', `Bearer ${token}`)
            .send(newExpenseData);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Insufficient funds in the account');
    });


    it('should return an error if account does not exist', async () => {
        const newExpenseData = {
            categoryId: category._id,
            account: '000000000000000000000000', // non-existing account
            amount: 500,
            date: new Date(),
            note: 'Test expense with non-existing account'
        };

        const res = await request(app)
            .post('/api/expense/createExpense')
            .set('Authorization', `Bearer ${token}`)
            .send(newExpenseData);

        expect(res.status).to.equal(404);
        expect(res.body).to.have.property('message', 'Account not found');
    });

    it('should return an error if category does not exist', async () => {
        const newExpenseData = {
            categoryId: '000000000000000000000000',
            account: account._id,
            amount: 500,
            date: new Date(),
            note: 'Test expense with non-existing category'
        };

        const res = await request(app)
            .post('/api/expense/createExpense')
            .set('Authorization', `Bearer ${token}`)
            .send(newExpenseData);

        expect(res.status).to.equal(404);
        expect(res.body).to.have.property('message', 'Category not found');
    });



    it('should return an error if required fields are missing', async () => {
        const newExpenseData = {
            categoryId: category._id,
            // account is missing
            amount: 500,
            date: new Date(),
            note: 'Test expense with missing fields'
        };

        const res = await request(app)
            .post('/api/expense/createExpense')
            .set('Authorization', `Bearer ${token}`)
            .send(newExpenseData);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Account is required');
    });

    it('should return an error if amount is not a number', async () => {
        const newExpenseData = {
            categoryId: category._id,
            account: account._id,
            amount: 'five hundred', // invalid amount
            date: new Date(),
            note: 'Test expense with invalid amount'
        };

        const res = await request(app)
            .post('/api/expense/createExpense')
            .set('Authorization', `Bearer ${token}`)
            .send(newExpenseData);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Amount must be a positive number');
    });


});