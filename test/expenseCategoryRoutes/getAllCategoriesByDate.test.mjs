import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';
import ExpenseCategoryLimit from '../../models/expense/expenseCategoryLimitModel.js';


describe('GET /api/expenseCategory/allCategories/:month/:year', function () {
    this.timeout(10000);

    let user;
    let token;
    let categories;
    let categoryLimits;

    before(async () => {
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        categories = await ExpenseCategory.insertMany([
            { name: 'Category 1', userId: user._id },
            { name: 'Category 2', userId: user._id },
            { name: 'Category 3', userId: user._id }
        ]);

        categoryLimits = await ExpenseCategoryLimit.insertMany([
            { categoryId: categories[0]._id, limit: 1000, month: 6, year: 2024 },
            { categoryId: categories[1]._id, limit: 1500, month: 6, year: 2024 },
        ]);
    });

    after(async () => {
        await User.deleteMany({});
        await ExpenseCategory.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});
    });

    it('should get all expense categories with limits, without limits, and with no expenses for the specified month and year', async () => {
        const month = 6;
        const year = 2024;

        const res = await request(app)
            .get(`/api/expenseCategory/allCategories/${month}/${year}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('categoriesWithLimits').that.is.an('array');
        expect(res.body).to.have.property('categoriesWithoutLimits').that.is.an('array');
        expect(res.body).to.have.property('categoriesWithNoExpenses').that.is.an('array');
    });

    it('should return empty arrays if no expense categories found for the specified month and year', async () => {
        const month = 9;
        const year = 2023;

        const res = await request(app)
            .get(`/api/expenseCategory/allCategories/${month}/${year}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.be.an('array').that.is.empty;
    });

});
