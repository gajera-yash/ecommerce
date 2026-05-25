const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/dashboardController');
router.get('/summary', auth, c.getSummary);
router.get('/charts', auth, c.getCharts);
router.get('/top-products', auth, c.getTopProducts);
module.exports = router;
