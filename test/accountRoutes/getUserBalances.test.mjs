import Account from "../../models/account/accountModel.js";
import User from '../../models/user/userModel.js';
import request from "supertest";
import app from "../testServer.js";
import {expect} from "chai";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    const token = jwt.sign(
        { user_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '5h' }
    );
    return token;
};


describe('GET /api/accounts/userBalances', function() {
    this.timeout(10000);

    let user;
    let token;
    let accounts;

    before(async () => {
        user = await User.create({ _id: "000000000000000000000000" });
        token = generateToken(user._id);

        accounts = await Account.insertMany([
            { name: 'Account 1', balance: 1000, userId: user._id },
            { name: 'Account 2', balance: 2000, userId: user._id }
        ]);
    });

    after(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
    });

    it('should return the balances of all user accounts', async () => {
        const res = await request(app)
            .get('/api/accounts/balances')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.be.an('array');
        expect(res.body.data.length).to.equal(2);

        const accountNames = res.body.data.map(account => account.name);
        const accountBalances = res.body.data.map(account => account.balance);

        expect(accountNames).to.include('Account 1');
        expect(accountNames).to.include('Account 2');
        expect(accountBalances).to.include(1000);
        expect(accountBalances).to.include(2000);
    });

    it('should return an empty array if the user has no accounts', async () => {
        const newUser = await User.create({ _id: "000000000000000000000000111" });
        const newToken = generateToken(newUser._id);

        const res = await request(app)
            .get('/api/accounts/balances')
            .set('Authorization', `Bearer ${newToken}`);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.be.an('array').that.is.empty;

        await User.findByIdAndDelete(newUser._id);
    });
});