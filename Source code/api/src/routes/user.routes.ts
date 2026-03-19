import { Router } from 'express';
import { getAllUsers, getUser, updateUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', getUser);
router.patch('/update', updateUser);

export default router;
