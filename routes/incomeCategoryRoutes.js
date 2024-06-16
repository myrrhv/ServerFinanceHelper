const express = require('express');
const router = express.Router();
const incomeCategoryController = require('../controllers/incomeCategoryController');
const auth = require("../middleware/auth");

// Маршрут для створення нової категорії доходу
router.post('/createIncomeCategory', auth.protect, incomeCategoryController.createIncomeCategory);

// Маршрут для редагування існуючої категорії доходу
router.put('/update/:id',auth.protect, incomeCategoryController.editIncomeCategory);

//Маршрут для отримання всіх категорій доходів
router.get('/allCategories/:month/:year',auth.protect, incomeCategoryController.getCategories);

module.exports = router;
