const express = require('express');
const router = express.Router();
const vitrikhoController = require('../controllers/vitrikhoController');

router.get('/vitrikho', vitrikhoController.getAll);
router.get('/vitrikho/:id', vitrikhoController.getById);
router.post('/vitrikho', vitrikhoController.create);
router.put('/vitrikho/:id', vitrikhoController.update);
router.delete('/vitrikho/:id', vitrikhoController.delete);

module.exports = router;