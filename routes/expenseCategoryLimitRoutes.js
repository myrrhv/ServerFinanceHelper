const express = require('express');
const router = express.Router();
const expenseCategoryLimitController = require('../controllers/expenseCategoryLimitController');
const auth = require("../middleware/auth");

// Додавання ліміту
router.post('/createLimit',auth.protect, expenseCategoryLimitController.createExpenseCategoryLimit);

// Редагування ліміту
router.put('/updateLimit/:limitId',auth.protect, expenseCategoryLimitController.updateExpenseCategoryLimit);

// Видалення ліміту
router.delete('/deleteLimit/:limitId',auth.protect, expenseCategoryLimitController.deleteExpenseCategoryLimit);

module.exports = router;
