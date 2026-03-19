import { Router } from 'express';
import {
  createTraceEvent,
  getEventsByProduct,
  getFullTrace,
  verifyTraceEvent,
} from '../controllers/traceEvent.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/verify/:eventId', verifyTraceEvent);
router.get('/:productId', getFullTrace);

router.use(authenticate);
router.get('/events/product/:productId', getEventsByProduct);
router.post('/events', authorize('admin', 'manager', 'farmer'), createTraceEvent);

export default router;
