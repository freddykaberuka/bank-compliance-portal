import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma/enums';

const router = Router();

router.use(authMiddleware);

router.post('/', authorizeRoles(UserRole.APPLICANT), ApplicationController.createApplication);
router.get('/', authorizeRoles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN), ApplicationController.getApplications);
router.get('/:id', authorizeRoles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN), ApplicationController.getApplication);

router.post('/:id/submit', authorizeRoles(UserRole.APPLICANT), ApplicationController.submitApplication);
router.post('/:id/review', authorizeRoles(UserRole.REVIEWER), ApplicationController.reviewApplication);
router.post('/:id/request-more-info', authorizeRoles(UserRole.REVIEWER), ApplicationController.requestMoreInfo);
router.post('/:id/approve', authorizeRoles(UserRole.APPROVER), ApplicationController.approveApplication);
router.post('/:id/reject', authorizeRoles(UserRole.APPROVER), ApplicationController.rejectApplication);

export default router;