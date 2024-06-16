const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');

// Маршрути для рахунків
//створити рахунок
router.post('/createAccount', auth.protect, accountController.createAccount);

//редагувати рахунок
router.put('/updateAccount/:id', auth.protect, accountController.updateAccount);

//видалити
router.delete('/deleteAccount/:id', auth.protect, accountController.deleteAccount);

//баланси рахунків користувача
router.get('/balances', auth.protect, accountController.getUserBalances);

module.exports = router;
