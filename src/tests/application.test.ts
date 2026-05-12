import dotenv from 'dotenv';
dotenv.config();
import prisma from '../prisma';
import { ApplicationService } from '../services/applicationService';
import { ConflictError } from '../utils/errors';
import { ApplicationState, LicenseType, UserRole } from '../generated/prisma/enums';
import bcrypt from 'bcryptjs';

// application optimistic locking tests
describe('Optimistic locking', () => {
  test('rejects stale concurrent updates', async () => {
    const hashedPassword = await bcrypt.hash('testpwd', 10);
    const applicant = await prisma.user.create({
      data: { email: `app.${Date.now()}@test.com`, password: hashedPassword, name: 'Test', role: UserRole.APPLICANT },
    });

    const app = await prisma.application.create({
      data: { userId: applicant.id, institutionName: 'Bank', licenseType: LicenseType.COMMERCIAL_BANK, state: ApplicationState.DRAFT },
    });

    const results = await Promise.allSettled([
      ApplicationService.submitApplication(applicant.id, app.id, app.version),
      ApplicationService.submitApplication(applicant.id, app.id, app.version),
    ]);

    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejectedResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    expect(rejectedResults.length).toBe(1);
    expect(rejectedResults[0].reason).toBeInstanceOf(ConflictError);

    const updated = await prisma.application.findUnique({ where: { id: app.id } });
    expect(updated?.version).toBe(app.version + 1);
    expect(updated?.state).toBe(ApplicationState.SUBMITTED);

    await prisma.auditLog.deleteMany({ where: { applicationId: app.id } });
    await prisma.application.delete({ where: { id: app.id } });
    await prisma.user.delete({ where: { id: applicant.id } });
    await prisma.$disconnect();
  });
});