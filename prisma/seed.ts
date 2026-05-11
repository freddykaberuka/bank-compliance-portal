import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/prisma';
import { UserRole, LicenseType, ApplicationState } from '../src/generated/prisma/enums';
import bcrypt from 'bcryptjs';

const DEVELOPMENT_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Password123!';

/**
 * Data definitions moved outside of logic for readability
 */
const SEED_USERS = [
  { name: 'Test Applicant', email: 'applicant@bank.test', role: UserRole.APPLICANT },
  { name: 'Second Applicant', email: 'applicant2@bank.test', role: UserRole.APPLICANT },
  { name: 'Test Reviewer', email: 'reviewer@bank.test', role: UserRole.REVIEWER },
  { name: 'Test Approver', email: 'approver@bank.test', role: UserRole.APPROVER },
  { name: 'Test Admin', email: 'admin@bank.test', role: UserRole.ADMIN },
] as const;

const SEED_APPLICATIONS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Submitted Compliance Application',
    institutionName: 'Unguka Financial',
    licenseType: LicenseType.RETAIL_BANK,
    description: 'Customer-facing retail banking license submitted for review.',
    state: ApplicationState.SUBMITTED,
    version: 2,
    userEmail: 'applicant@bank.test',
    documents: [
      {
        id: '00000000-0000-0000-0000-000000000101',
        fileName: 'retail_license_form.pdf',
        filePath: 'uploads/seed/retail_license_form.pdf',
        mimeType: 'application/pdf',
        fileSize: 198432,
        version: 1,
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Under Review Compliance Application',
    institutionName: 'Guarrant Trust Bank',
    licenseType: LicenseType.COMMERCIAL_BANK,
    description: 'Commercial banking application currently under review by compliance.',
    state: ApplicationState.UNDER_REVIEW,
    version: 3,
    userEmail: 'applicant2@bank.test',
    documents: [
      {
        id: '00000000-0000-0000-0000-000000000201',
        fileName: 'corporate_financials.xlsx',
        filePath: 'uploads/seed/corporate_financials.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 445120,
        version: 1,
      },
      {
        id: '00000000-0000-0000-0000-000000000202',
        fileName: 'executive_summary.pdf',
        filePath: 'uploads/seed/executive_summary.pdf',
        mimeType: 'application/pdf',
        fileSize: 132480,
        version: 2,
      },
    ],
  },
] as const;

async function seedUsers(hashedPassword: string) {
  return Promise.all(
    SEED_USERS.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          password: hashedPassword,
        },
        create: {
          name: user.name,
          email: user.email,
          role: user.role,
          password: hashedPassword,
        },
      })
    )
  );
}

async function seedApplications() {
  const applicantOne = await prisma.user.findUnique({ where: { email: 'applicant@bank.test' } });
  const applicantTwo = await prisma.user.findUnique({ where: { email: 'applicant2@bank.test' } });

  if (!applicantOne || !applicantTwo) {
    throw new Error('Applicant users must exist before seeding applications.');
  }

  const applications = [
    {
      ...SEED_APPLICATIONS[0],
      userId: applicantOne.id,
    },
    {
      ...SEED_APPLICATIONS[1],
      userId: applicantTwo.id,
    },
  ];

  for (const application of applications) {
    const createdApp = await prisma.application.upsert({
      where: { id: application.id },
      update: {
        institutionName: application.institutionName,
        licenseType: application.licenseType,
        description: application.description,
        state: application.state,
        version: application.version,
        userId: application.userId,
      },
      create: {
        id: application.id,
        institutionName: application.institutionName,
        licenseType: application.licenseType,
        description: application.description,
        state: application.state,
        version: application.version,
        userId: application.userId,
      },
    });

    for (const doc of application.documents) {
      await prisma.document.upsert({
        where: { id: doc.id },
        update: {
          applicationId: createdApp.id,
          uploadedById: application.userId,
          version: doc.version,
          fileName: doc.fileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
        },
        create: {
          id: doc.id,
          applicationId: createdApp.id,
          uploadedById: application.userId,
          version: doc.version,
          fileName: doc.fileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
        },
      });
    }
  }
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEVELOPMENT_PASSWORD, 10);

  await prisma.$connect();

  try {
    const users = await seedUsers(hashedPassword);
    console.log(`Successfully seeded ${users.length} users.`);

    await seedApplications();
    console.log('Successfully seeded workflow applications and documents.');
  } catch (error) {
    throw new Error(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });