import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import Income from '../../models/income/incomeModel.js';
import Expense from '../../models/expense/expenseModel.js';
import Account from '../../models/account/accountModel.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';
import generateToken from '../utils/generateToken.mjs';

describe('GET /api/users/getAllMonthSummaries/:year', function () {
    this.timeout(10000);

    let user;
    let token;
    let account;
    let incomeCategory;
    let expenseCategory;

    before(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Income.deleteMany({});
        await Expense.deleteMany({});
        await IncomeCategory.deleteMany({});
        await ExpenseCategory.deleteMany({});

        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
        incomeCategory = await IncomeCategory.create({ name: 'Test Income Category', userId: user._id });
        expenseCategory = await ExpenseCategory.create({ name: 'Test Expense Category', userId: user._id });

        await Income.create({ categoryId: incomeCategory._id, amount: 500, date: new Date(2023, 0, 15), account: account._id, userId: user._id });
        await Expense.create({ categoryId: expenseCategory._id, amount: 200, date: new Date(2023, 0, 15), account: account._id, userId: user._id });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Income.deleteMany({});
        await Expense.deleteMany({});
        await IncomeCategory.deleteMany({});
        await ExpenseCategory.deleteMany({});
    });

    it('should get all month summaries for the specified year', async () => {
        const res = await request(app)
            .get('/api/users/getAllMonthSummaries/2023')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('yearInfo');
        expect(res.body.yearInfo).to.have.property('yearIncomeTotal', 500);
        expect(res.body.yearInfo).to.have.property('yearExpenseTotal', 200);
        expect(res.body.yearInfo).to.have.property('yearTotal', 300);

        expect(res.body).to.have.property('arrayOfMonth');
        expect(res.body.arrayOfMonth).to.be.an('array');
        expect(res.body.arrayOfMonth[0]).to.have.property('month', 1);
        expect(res.body.arrayOfMonth[0]).to.have.property('incomeTotal', 500);
        expect(res.body.arrayOfMonth[0]).to.have.property('expenseTotal', 200);
    });

    it('should return 400 if year is invalid', async () => {
        const res = await request(app)
            .get('/api/users/getAllMonthSummaries/abcd')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Invalid year');
    });

    it('should return empty array if there are no incomes or expenses', async () => {
        const res = await request(app)
            .get('/api/users/getAllMonthSummaries/2024')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('yearInfo');
        expect(res.body.yearInfo).to.have.property('yearIncomeTotal', 0);
        expect(res.body.yearInfo).to.have.property('yearExpenseTotal', 0);
        expect(res.body.yearInfo).to.have.property('yearTotal', 0);

        expect(res.body).to.have.property('arrayOfMonth');
        expect(res.body.arrayOfMonth).to.be.an('array').that.is.empty;
    });
});
