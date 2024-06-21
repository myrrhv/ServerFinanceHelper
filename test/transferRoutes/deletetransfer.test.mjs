import request  from 'supertest';
import { expect } from 'chai';

import app from '../testServer.js';
import Transfer from '../../models/transfer/transferModel.js';
import Account from '../../models/account/accountModel.js';
import User from '../../models/user/userModel.js';
import generateToken  from '../utils/generateToken.mjs';

describe('DELETE /api/transfer/deleteTransfer/:transferId', () => {
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

    it('should delete a transfer successfully', async () => {
        const initialFromAccountBalance = fromAccount.balance;
        const initialToAccountBalance = toAccount.balance;

        const res = await request(app)
            .delete(`/api/transfer/deleteTransfer/${transfer._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send();

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('message', 'The transfer was successfully deleted');

        const updatedFromAccount = await Account.findById(fromAccount._id);
        const updatedToAccount = await Account.findById(toAccount._id);

        expect(updatedFromAccount.balance).to.equal(initialFromAccountBalance + transfer.amount);
        expect(updatedToAccount.balance).to.equal(initialToAccountBalance - transfer.amount);
    });

    it('should return 404 if transfer not found', async () => {
        const invalidTransferId = '000000000000000000000000';

        const res = await request(app)
            .delete(`/api/transfer/deleteTransfer/${invalidTransferId}`)
            .set('Authorization', `Bearer ${token}`)
            .send();

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message', 'Transfer not found');
    });
});