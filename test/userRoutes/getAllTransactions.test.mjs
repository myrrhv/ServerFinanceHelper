import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import Income from '../../models/income/incomeModel.js';
import Expense from '../../models/expense/expenseModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';
import IncomeCategory from "../../models/income/incomeCategoryModel.js";
import ExpenseCategory from "../../models/expense/expenseCategoryModel.js";

describe('GET /api/user/getAllTransactions/:month/:year', function () {
    this.timeout(10000);

    let user;
    let token;
    let account;
    let incomeCategory;
    let expenseCategory;
    let income;
    let expense;

    before(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Income.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Expense.deleteMany({});
        await ExpenseCategory.deleteMany({});

        user = await User.create({ _id: "00000", name: 'Test User' });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
        incomeCategory = await IncomeCategory.create({ name: 'Test Income Category', userId: user._id });
        expenseCategory = await ExpenseCategory.create({ name: 'Test Expense Category', userId: user._id });
        income = await Income.create({ categoryId: incomeCategory._id, amount: 500,  account: account._id, userId: user._id });
        expense = await Expense.create({ categoryId: expenseCategory._id, amount: 200,  account: account._id, userId: user._id });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Income.deleteMany({});
        await IncomeCategory.deleteMany({});
        await Expense.deleteMany({});
        await ExpenseCategory.deleteMany({});
    });

    it('should get all transactions for the specified month and year', async () => {
        const res = await request(app)
            .get('/api/users/getAllTransactions/6/2024')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('transactions').that.is.an('array').with.lengthOf(2);
        expect(res.body).to.have.property('amount_income', 500);
        expect(res.body).to.have.property('amount_expense', 200);
        expect(res.body).to.have.property('total', 300);

        const incomeTransaction = res.body.transactions.find(tx => tx.type === 'income');
        expect(incomeTransaction).to.include({
            transactionId: income._id.toString(),
            categoryId: incomeCategory._id.toString(),
            amount: 500,
            accountId: account._id.toString(),
            type: 'income'
        });

        const expenseTransaction = res.body.transactions.find(tx => tx.type === 'expense');
        expect(expenseTransaction).to.include({
            transactionId: expense._id.toString(),
            categoryId: expenseCategory._id.toString(),
            amount: 200,
            accountId: account._id.toString(),
            type: 'expense'
        });
    });

    it('should return empty transactions if no transactions are found', async () => {
        const res = await request(app)
            .get('/api/users/getAllTransactions/1/2022')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('transactions').that.is.an('array').with.lengthOf(0);
        expect(res.body).to.have.property('amount_income', 0);
        expect(res.body).to.have.property('amount_expense', 0);
        expect(res.body).to.have.property('total', 0);
    });

    it('should return 400 if month or year is invalid', async () => {
        const res = await request(app)
            .get('/api/users/getAllTransactions/invalidMonth/2023')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Invalid month or year');
    });


});
