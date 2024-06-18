const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');
const auth = require('../middleware/auth');

//створити категорію витрат
router.post('/createExpenseCategory',auth.protect, expenseCategoryController.addExpenseCategory);

// редагувати категорію витрат
router.put('/updateExpenseCategory/:categoryId',auth.protect, expenseCategoryController.editExpenseCategory);

//отримати всі категорії витрат
router.get('/allCategories', auth.protect, expenseCategoryController.getAllCategories);

//отримати всі категорії витрат із всіма іними даними
router.get('/allCategories/:month/:year', auth.protect, expenseCategoryController.getAllCategoriesByDate );


module.exports = router;
