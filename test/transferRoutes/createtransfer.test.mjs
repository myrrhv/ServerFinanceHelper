import request  from 'supertest';
import { expect } from 'chai';

import app from '../testServer.js';
import Transfer from '../../models/transfer/transferModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';

describe('POST /api/transfer/createTransfer', () => {
    let user;
    let token;
    let fromAccount;
    let toAccount;

    before(async () => {
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        fromAccount = await Account.create({ name: 'From Account', balance: 1000, userId: user._id });
        toAccount = await Account.create({ name: 'To Account', balance: 500, userId: user._id });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Transfer.deleteMany({});
    });

    it('should create a new transfer', async () => {
        const transferData = {
            amount: 300,
            date: new Date(),
            fromAccountId: fromAccount._id,
            toAccountId: toAccount._id
        };

        const res = await request(app)
            .post('/api/transfer/createTransfer')
            .set('Authorization', `Bearer ${token}`)
            .send(transferData);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('amount', transferData.amount);

        const updatedFromAccount = await Account.findById(fromAccount._id);
        const updatedToAccount = await Account.findById(toAccount._id);

        expect(updatedFromAccount.balance).to.equal(fromAccount.balance - transferData.amount);
        expect(updatedToAccount.balance).to.equal(toAccount.balance + transferData.amount);


        const savedTransfer = await Transfer.findById(res.body._id);
        expect(savedTransfer).to.exist;
    });

    it('should return 404 if fromAccount not found', async () => {
        const transferData = {
            amount: 200,
            date: new Date(),
            fromAccountId: '000000000000000000000000',
            toAccountId: toAccount._id
        };

        const res = await request(app)
            .post('/api/transfer/createTransfer')
            .set('Authorization', `Bearer ${token}`)
            .send(transferData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'From account not found');
    });

    it('should return 404 if toAccount not found', async () => {
        const transferData = {
            amount: 200,
            date: new Date(),
            fromAccountId: fromAccount._id,
            toAccountId: '000000000000000000000000'
        };

        const res = await request(app)
            .post('/api/transfer/createTransfer')
            .set('Authorization', `Bearer ${token}`)
            .send(transferData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'To account not found');
    });

    it('should return 400 if not enough balance in fromAccount', async () => {
        const transferData = {
            amount: 1500,
            date: new Date(),
            fromAccountId: fromAccount._id,
            toAccountId: toAccount._id
        };

        const res = await request(app)
            .post('/api/transfer/createTransfer')
            .set('Authorization', `Bearer ${token}`)
            .send(transferData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Insufficient funds in the from account');
    });
});
