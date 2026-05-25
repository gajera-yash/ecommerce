const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/expenseController');
router.get('/', auth, c.getExpenses);
router.post('/', auth, c.createExpense);
router.put('/:id', auth, c.updateExpense);
router.delete('/:id', auth, c.deleteExpense);
module.exports = router;
