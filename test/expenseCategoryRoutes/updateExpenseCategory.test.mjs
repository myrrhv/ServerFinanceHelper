import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';
import ExpenseCategoryLimit from '../../models/expense/expenseCategoryLimitModel.js'


describe('PUT /api/expenseCategory/updateExpenseCategory/:categoryId', function () {
    this.timeout(10000);

    let user;
    let token;
    let category;
    let categoryLimit;

    before(async () => {
        await User.deleteMany({});
        await ExpenseCategory.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});

        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        category = await ExpenseCategory.create({ name: 'Test Expense Category', userId: user._id });
        categoryLimit = await ExpenseCategoryLimit.create({
            categoryId: category._id,
            limit: 1000,
            month: 6,
            year: 2024
        });
    });

    after(async () => {
        await User.deleteMany({});
        await ExpenseCategory.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});
    });

    it('should edit an expense category without changing limit', async () => {
        const updatedName = 'Updated Expense Category Name';

        const res = await request(app)
            .put(`/api/expenseCategory/updateExpenseCategory/${category._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: updatedName });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.have.property('name', updatedName);

        // Перевірка, що ліміт не змінився
        const updatedCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: category._id });
        expect(updatedCategoryLimit).to.exist;
        expect(updatedCategoryLimit.limit).to.equal(categoryLimit.limit);
    });

    it('should edit an expense category and update limit', async () => {
        const updatedLimit = 1500;

        const res = await request(app)
            .put(`/api/expenseCategory/updateExpenseCategory/${category._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name:category.name ,limit: updatedLimit });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');

        // Перевірка, що ліміт було оновлено в базі даних
        const updatedCategoryLimit = await ExpenseCategoryLimit.findOne({ categoryId: category._id });
        expect(updatedCategoryLimit).to.exist;
        expect(updatedCategoryLimit.limit).to.equal(updatedLimit);
    });

    it('should return 404 if expense category not found', async () => {
        const res = await request(app)
            .put('/api/expenseCategory/updateExpenseCategory/000000000000000000000000') // Несуществующий ID
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Expense Category Name' });

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Expense category not found');
    });


});