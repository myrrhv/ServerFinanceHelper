const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const auth = require('../middleware/auth');


// Маршрут для створення переказу
router.post('/createTransfer', transferController.createTransfer);

// Маршрут для оновлення переказу
router.put('/updateTransfer/:transferId',auth.protect, transferController.updateTransfer);

// Маршрут для видалення переказу
router.delete('/deleteTransfer/:transferId',auth.protect,  transferController.deleteTransfer);

module.exports = router;
