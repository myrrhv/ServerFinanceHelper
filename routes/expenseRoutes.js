const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require("../middleware/auth");

// Додавання витрати
router.post('/createExpense',auth.protect, expenseController.createExpense);

// Редагування витрати
router.put('/updateExpense/:expenseId',auth.protect, expenseController.updateExpense);

// Видалення витрати
router.delete('/deleteExpense/:expenseId', auth.protect,expenseController.deleteExpense);

module.exports = router;
