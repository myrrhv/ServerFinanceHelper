import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import IncomeCategory from '../../models/income/incomeCategoryModel.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';

describe('PUT /api/incomeCategory/update/:id', function () {
    this.timeout(10000);

    let user;
    let token;
    let incomeCategory;

    before(async () => {
        await User.deleteMany({});
        await IncomeCategory.deleteMany({});

        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        incomeCategory = await IncomeCategory.create({
            name: 'Initial Category',
            userId: user._id
        });
    });

    after(async () => {
        await User.deleteMany({});
        await IncomeCategory.deleteMany({});
    });

    it('should update an existing income category', async () => {
        const updatedData = {
            name: 'Updated Category'
        };

        const res = await request(app)
            .put(`/api/incomeCategory/update/${incomeCategory._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.have.property('name', updatedData.name);

        const updatedCategory = await IncomeCategory.findById(incomeCategory._id);
        expect(updatedCategory).to.exist;
        expect(updatedCategory.name).to.equal(updatedData.name);
    });

    it('should return 404 if income category not found', async () => {
        const nonExistentId = '000000000000000000000000'; // Несуществующий ID
        const res = await request(app)
            .put(`/api/incomeCategory/update/${nonExistentId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Name' });

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Income category not found');
    });

    it('should return 400 if new category name already exists for the user', async () => {
        const anotherCategory = await IncomeCategory.create({
            name: 'Another Category',
            userId: user._id
        });


        const res = await request(app)
            .put(`/api/incomeCategory/update/${incomeCategory._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Another Category' });

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Category already exists');
    });
});
