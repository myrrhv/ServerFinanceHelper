import request  from 'supertest';
import { expect } from 'chai';
import User from '../../models/user/userModel.js';
import app from '../testServer.js';

describe('POST /api/users/createUser', () => {

    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should create a new user if firebaseId is provided', async () => {
        const firebaseId = 'testFirebaseId';

        const res = await request(app)
            .post('/api/users/createUser')
            .send({ firebaseId });

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('_id', firebaseId);

        // Перевірка чи користувач збережений у базі даних
        const user = await User.findOne({ _id: firebaseId });
        expect(user).to.exist;
        expect(user._id).to.equal(firebaseId);
    });

    it('should return 400 if firebaseId is missing', async () => {
        const res = await request(app)
            .post('/api/users/createUser')
            .send({});

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('error', 'firebaseId is required');

        // Перевірка чи користувач не створений у базі даних
        const users = await User.find({});
        expect(users).to.be.empty;
    });

    it('should return 400 if user with provided firebaseId already exists', async () => {
        const firebaseId = 'testFirebaseId';

        // Створення користувача у базі даних заздалегідь
        await User.create({ _id: firebaseId });

        const res = await request(app)
            .post('/api/users/createUser')
            .send({ firebaseId });

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('error', 'User already exists');

        // Перевірка чи є тільки один користувач у базі даних
        const users = await User.find({});
        expect(users).to.have.lengthOf(1);
    });


    it('should return error if firebaseId is missing', (done) => {
        request(app)
            .post('/api/users/createUser')
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('error', 'firebaseId is required');
                done();
            });
    });


});