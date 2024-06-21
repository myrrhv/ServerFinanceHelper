import request  from 'supertest';
import { expect } from 'chai';

import app from '../testServer.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import User from '../../models/user/userModel.js';

import generateToken  from '../utils/generateToken.mjs';


describe('POST /api/incomeCategory/createIncomeCategory', function () {
    this.timeout(10000);
    let user;
    let token;

    before(async () => {
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);
    });

    after(async () => {
        await User.deleteMany({});
        await IncomeCategory.deleteMany({});
    });

    beforeEach(async () => {
        await IncomeCategory.deleteMany({});
    });

    it('should create a new income category', async () => {
        const incomeCategoryData = {
            name: 'Test Income Category'
        };

        const res = await request(app)
            .post('/api/incomeCategory/createIncomeCategory')
            .set('Authorization', `Bearer ${token}`)
            .send(incomeCategoryData);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.have.property('name', incomeCategoryData.name);

        const savedCategory = await IncomeCategory.findById(res.body.data._id);
        expect(savedCategory).to.exist;
        expect(savedCategory.name).to.equal(incomeCategoryData.name);
    });

    it('should return 400 if user has reached the limit of 15 categories', async () => {
        const categoriesToCreate = 15;
        for (let i = 0; i < categoriesToCreate; i++) {
            await IncomeCategory.create({ name: `Category ${i}`, userId: user._id });
        }

        const res = await request(app)
            .post('/api/incomeCategory/createIncomeCategory')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Category' });

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'User has reached the limit of 15 categories');
    });

    it('should return 400 if category name already exists for the user', async () => {

        const initialCategory = await IncomeCategory.create({
            name: 'Test Category',
            userId: user._id
        });

        const duplicateCategoryData = {
            name: 'Test Category',
        };

        const res = await request(app)
            .post('/api/incomeCategory/createIncomeCategory')
            .set('Authorization', `Bearer ${token}`)
            .send(duplicateCategoryData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Category already exists');
    });
});