import request  from 'supertest';
import { expect } from 'chai';
import User from '../../models/user/userModel.js';
import Account from '../../models/account/accountModel.js';

import app from '../testServer.js';
import jwt from "jsonwebtoken";


const generateToken = (userId) => {
    const token = jwt.sign(
        { user_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
    );
    return token;
};

describe('POST /api/accounts/createAccount', () => {
    let user;

    before(async () => {
        user = await User.create({ _id : "111111" });
    });

    afterEach(async () => {
        await Account.deleteMany({});
    });

    after(async () => {
        await User.deleteMany({});
    });

    it('should create a new account', async () => {
        const newAccountData = {
            name: 'Test Account',
            balance: 1000
        };

        const res = await request(app)
            .post('/api/accounts/createAccount')
            .set('Authorization', `Bearer ${generateToken(user._id)}`)
            .send(newAccountData);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.be.an('object');
        expect(res.body.data).to.have.property('name', newAccountData.name);
        expect(res.body.data).to.have.property('balance', newAccountData.balance);

        const savedAccount = await Account.findById(res.body.data._id);
        expect(savedAccount).to.not.be.null;
        expect(savedAccount.name).to.equal(newAccountData.name);
        expect(savedAccount.balance).to.equal(newAccountData.balance);
    });

    it('should return 400 if account name is missing', async () => {
        const newAccountData = {
            balance: 1000
        };

        const res = await request(app)
            .post('/api/accounts/createAccount')
            .set('Authorization', `Bearer ${generateToken(user._id)}`)
            .send(newAccountData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
    });

    it('should return 400 if balance is negative', async () => {
        const newAccountData = {
            name: 'Test Account',
            balance: -1000
        };

        const res = await request(app)
            .post('/api/accounts/createAccount')
            .set('Authorization', `Bearer ${generateToken(user._id)}`)
            .send(newAccountData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
    });


    it('should return 400 if user has reached the limit of 15 accounts', async () => {
        const newAccountData = {
            name: 'Test Account',
            balance: 1000
        };

        for (let i = 0; i < 15; i++) {
            await Account.create({ name: `Account ${i}`, balance: 1000, userId: user._id });
        }

        const res = await request(app)
            .post('/api/accounts/createAccount')
            .set('Authorization', `Bearer ${generateToken(user._id)}`)
            .send(newAccountData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'User has reached the limit of 15 accounts');
    });
});

