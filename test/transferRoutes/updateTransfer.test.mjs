import request from 'supertest';
import { expect } from 'chai';
import app from '../testServer.js';
import Transfer from '../../models/transfer/transferModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';

describe('PUT /api/transfer/updateTransfer/:transferId', () => {
    let user;
    let token;
    let transfer;
    let fromAccount;
    let toAccount;

    before(async () => {
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);


        fromAccount = await Account.create({ name: 'From Account', balance: 1000, userId: user._id });
        toAccount = await Account.create({ name: 'To Account', balance: 500, userId: user._id });

        transfer = await Transfer.create({
            amount: 300,
            date: new Date(),
            fromAccountId: fromAccount._id,
            toAccountId: toAccount._id,
            userId: user._id
        });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        await Transfer.deleteMany({});
    });

    it('should update a transfer successfully', async () => {
        const updatedData = {
            amount: 500,
            date: new Date(),
            fromAccountId: fromAccount._id,
            toAccountId: toAccount._id
        };

        const initialFromAccountBalance = fromAccount.balance;
        const initialToAccountBalance = toAccount.balance;

        const res = await request(app)
            .put(`/api/transfer/updateTransfer/${transfer._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('amount', updatedData.amount);
        expect(res.body).to.have.property('date');

        const updatedFromAccount = await Account.findById(fromAccount._id);
        const updatedToAccount = await Account.findById(toAccount._id);

        expect(updatedFromAccount.balance).to.equal(initialFromAccountBalance - updatedData.amount);
        expect(updatedToAccount.balance).to.equal(initialToAccountBalance + updatedData.amount);
    });

    it('should return 404 if transfer not found', async () => {
        const invalidTransferId = '000000000000000000000000';

        const res = await request(app)
            .put(`/api/transfer/updateTransfer/${invalidTransferId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'Transfer not found');
    });

    it('should return 404 if fromAccount not found', async () => {
        const updatedData = {
            fromAccountId: '000000000000000000000000',
            toAccountId: toAccount._id
        };

        const res = await request(app)
            .put(`/api/transfer/updateTransfer/${transfer._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'From account not found');
    });

    it('should return 404 if toAccount not found', async () => {
        const updatedData = {
            fromAccountId: fromAccount._id,
            toAccountId: '000000000000000000000000'
        };

        const res = await request(app)
            .put(`/api/transfer/updateTransfer/${transfer._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'To account not found');
    });

    it('should return 400 if not enough balance in fromAccount', async () => {
        const updatedData = {
            amount: 1500,
            fromAccountId: fromAccount._id,
            toAccountId: toAccount._idі
        };

        const res = await request(app)
            .put(`/api/transfer/updateTransfer/${transfer._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Insufficient funds in the from account');
    });


});