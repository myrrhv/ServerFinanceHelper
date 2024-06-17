const mongoose = require('mongoose')
const Account = require('../models/account/accountModel');

const connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`mongoDB connected: ${con.connection.host}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    try {
        await Account.syncIndexes();
        console.log('Indexes synchronized successfully');
    } catch (error) {
        console.error('Error synchronizing indexes:', error);
    }
};
connectDB();

