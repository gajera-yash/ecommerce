const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/reportController');
router.get('/platform', auth, c.platformReport);
router.get('/products', auth, c.productReport);
router.get('/monthly-pnl', auth, c.monthlyPnl);
router.get('/export-csv', auth, c.exportCsv);
router.get('/overall-summary', auth, c.overallSummary);
module.exports = router;
