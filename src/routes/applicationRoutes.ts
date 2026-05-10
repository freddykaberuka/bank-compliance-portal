import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

router.use(authMiddleware);

router.post('/', authorizeRoles(UserRole.APPLICANT), ApplicationController.createApplication);
router.get('/', authorizeRoles(UserRole.APPLICANT, UserRole.REVIEWER), ApplicationController.getApplications);
router.get('/:id', authorizeRoles(UserRole.APPLICANT, UserRole.REVIEWER), ApplicationController.getApplication);

export default router;