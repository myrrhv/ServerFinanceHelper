import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';


describe('GET /api/expenseCategory/allCategories', function () {
    this.timeout(10000);

    let user;
    let token;

    before(async () => {
        await ExpenseCategory.deleteMany({});

        await User.deleteMany({});
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        await ExpenseCategory.create([
            { name: 'Category 1', userId: user._id },
            { name: 'Category 2', userId: user._id },
            { name: 'Category 3', userId: 'other-user-id' },
        ]);
    });

    after(async () => {
        await User.deleteMany({});
        await ExpenseCategory.deleteMany({});
    });

    it('should get all expense categories for the authenticated user', async () => {
        const res = await request(app)
            .get('/api/expenseCategory/allCategories')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body).to.have.property('data').to.be.an('array');
        expect(res.body.data).to.have.lengthOf(2);
    });


});