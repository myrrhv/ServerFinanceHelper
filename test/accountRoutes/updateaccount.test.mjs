import User from "../../models/user/userModel.js";
import Account from "../../models/account/accountModel.js";
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

describe('PUT /api/accounts/updateAccount/:id', () => {
    let user;
    let token;
    let account;

    before(async () => {
        user = await User.create({ _id: "000000000000000000000000" });
        token = generateToken(user._id);

        account = await Account.create({ name: 'Initial Account', balance: 1000, userId: user._id });
    });

    after(async () => {
        // Видалення тестового користувача і рахунків після завершення всіх тестів
        await User.deleteMany({});
        await Account.deleteMany({});
    });

    it('should update an existing account', async () => {
        const updatedData = {
            name: 'Updated Account',
            balance: 2000
        };

        const res = await request(app)
            .put(`/api/accounts/updateAccount/${account._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body.data).to.have.property('name', updatedData.name);
        expect(res.body.data).to.have.property('balance', updatedData.balance);

        const updatedAccount = await Account.findById(account._id);
        expect(updatedAccount).to.not.be.null;
        expect(updatedAccount.name).to.equal(updatedData.name);
        expect(updatedAccount.balance).to.equal(updatedData.balance);
    });

    it('should return 404 if account not found', async () => {
        const nonExistentAccountId = '000000000000000000000000';

        const updatedData = {
            name: 'Non-existent Account',
            balance: 2000
        };

        const res = await request(app)
            .put(`/api/accounts/updateAccount/${nonExistentAccountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Account not found');
    });

    it('should return 400 if balance is negative', async () => {
        const updatedData = {
            name: 'Updated Account',
            balance: -2000
        };

        const res = await request(app)
            .put(`/api/accounts/updateAccount/${account._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('status', 'error');
        expect(res.body).to.have.property('message', 'Balance cannot be negative');
    });
});