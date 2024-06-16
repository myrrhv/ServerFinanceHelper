const cors = require('cors');
const express = require('express');
const app = express();
const port = 7777;
require('dotenv').config();
require('./config/database');


app.use(express.json());
app.use(cors());
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const incomeCategoryRoutes = require('./routes/incomeCategoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const expenseCategoryRoutes = require('./routes/expenseCategoryRoutes');
const expenseLimitRoutes = require('./routes/expenseCategoryLimitRoutes');
const transferRoutes = require('./routes/transferRoutes');

require('./middleware/firebaseAdmin');

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
