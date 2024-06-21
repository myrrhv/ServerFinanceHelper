import request  from 'supertest';
import { expect } from 'chai';
import User from '../../models/user/userModel.js';
import Account from '../../models/account/accountModel.js';

import app from '../testServer.js';

import generateToken  from '../utils/generateToken.mjs';


describe('DELETE /api/accounts/deleteAccount/:id', () => {
    let user;
    let token;
    let account;

    before(async () => {
        user = await User.create({ _id: "00000" });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Test Account', balance: 1000, userId: user._id });
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
    });

    it('should delete an existing account', async () => {
        const res = await request(app)
            .delete(`/api/accounts/deleteAccount/${account._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(204);

        const deletedAccount = await Account.findById(account._id);
        expect(deletedAccount).to.be.null;
    });

    it('should return 404 if account not found', async () => {
        const nonExistentAccountId = '000000000000000000000000';

        const res = await request(app)
            .delete(`/api/accounts/deleteAccount/${nonExistentAccountId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Account not found');
    });


});