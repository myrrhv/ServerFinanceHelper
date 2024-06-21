import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';

describe('POST /api/expenseCategory/createExpenseCategory', function () {
    let user;
    let token;


    beforeEach(async () => {
        await User.deleteMany({});
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);
    });

    afterEach(async () => {
        await ExpenseCategory.deleteMany({});
    });

    it('should create an expense category', async () => {
        const newCategoryData = {
            name: 'New Expense Category'
        };

        const res = await request(app)
            .post('/api/expenseCategory/createExpenseCategory')
            .set('Authorization', `Bearer ${token}`)
            .send(newCategoryData);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.have.property('name', newCategoryData.name);
    });

    it('should return error if user has reached the limit of 15 categories', async () => {

        const categories = [];
        for (let i = 1; i <= 15; i++) {
            categories.push({
                name: `Category ${i}`,
                userId: user._id
            });
        }
        await ExpenseCategory.insertMany(categories);

        const newCategoryData = {
            name: 'Another Category'
        };

        const res = await request(app)
            .post('/api/expenseCategory/createExpenseCategory')
            .set('Authorization', `Bearer ${token}`)
            .send(newCategoryData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'User has reached the limit of 15 categories');
    });
});
