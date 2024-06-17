const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');
const auth = require('../middleware/auth');
const userController = require("../controllers/userController");

//створити категорію витрат
router.post('/createExpenseCategory',auth.protect,  expenseCategoryController.addExpenseCategory);

// редагувати категорію витрат
router.put('/updateExpenseCategory/:categoryId',auth.protect, expenseCategoryController.editExpenseCategory);

router.get('/allCategories/:month/:year',auth.protect, expenseCategoryController.getAllCategories );


module.exports = router;
