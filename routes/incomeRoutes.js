const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const auth = require('../middleware/auth');


// Маршрут для створення доходу
router.post('/createIncome', auth.protect, incomeController.createIncome);

// Маршрут для оновлення існуючого доходу
router.put('/updateIncome/:incomeId',auth.protect, incomeController.updateIncome);

// Маршрут для видалення існуючого доходу
router.delete('/deleteIncome/:incomeId',auth.protect, incomeController.deleteIncome);

module.exports = router;
