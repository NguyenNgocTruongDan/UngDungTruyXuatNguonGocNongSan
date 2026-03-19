import { Router } from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProduct);

router.use(authenticate);
router.post('/', authorize('admin', 'manager', 'farmer'), createProduct);
router.patch('/:id', authorize('admin', 'manager'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
