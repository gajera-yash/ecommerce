const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/productController');
router.get('/', auth, c.getProducts);
router.post('/', auth, c.createProduct);
router.put('/:id', auth, c.updateProduct);
router.delete('/:id', auth, c.deleteProduct);
module.exports = router;
