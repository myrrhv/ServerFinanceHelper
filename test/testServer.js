const cors = require('cors');
const express = require('express');

const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7778;


app.use(express.json());
app.use(cors());
const userRoutes = require('../routes/userRoutes');
const accountRoutes = require('../routes/accountRoutes');
const incomeRoutes = require('../routes/incomeRoutes');
const incomeCategoryRoutes = require('../routes/incomeCategoryRoutes');
const expenseRoutes = require('../routes/expenseRoutes');
const expenseCategoryRoutes = require('../routes/expenseCategoryRoutes');
const expenseLimitRoutes = require('../routes/expenseCategoryLimitRoutes');
const transferRoutes = require('../routes/transferRoutes');

require('../middleware/firebaseAdmin');


const connectDB = async () => {
    try {
        const con = await mongoose.connect('mongodb+srv://miraaa31v:ejgQCiG7Da29LuBP@cluster0.fp5ffyt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB connected for tests: ${con.connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
connectDB();


app.use(express.json());
app.use(cors());

app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/incomeCategory', incomeCategoryRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/expenseCategory', expenseCategoryRoutes);
app.use('/api/expenseLimit', expenseLimitRoutes);
app.use('/api/transfer', transferRoutes);

app.get('/', (req, res) => {
    res.send('Server running!');
});


app.listen(port, () => {
        console.log(`App is running on port ${port}`);
    }
);

module.exports = app;