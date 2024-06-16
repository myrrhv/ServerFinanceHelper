const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require("../middleware/auth");

//при реєстрації створити користувача в бд
router.post('/createUser', userController.createUser);

//всі доходи і витрати за вказаний місяць
router.get('/getAllTransactions',auth.protect,  userController.getAllTransactions);

//всі доходи і витрати за вказаний рік
router.get('/getAllMonthSummaries',auth.protect,  userController.getAllMonthSummaries);

// видалити категорію
router.delete('/deleteCategory/:categoryId',auth.protect,  userController.deleteCategory);

module.exports = router;