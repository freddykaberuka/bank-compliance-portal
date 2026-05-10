import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', ApplicationController.createApplication);
router.get('/', ApplicationController.getApplications);
router.get('/:id', ApplicationController.getApplication);

export default router;