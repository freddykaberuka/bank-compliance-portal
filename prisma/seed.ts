import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/prisma';
import { UserRole } from '../src/generated/prisma/enums';
import bcrypt from 'bcryptjs';

const DEVELOPMENT_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Password123!';

/**
 * Data definitions moved outside of logic for readability
 */
const SEED_USERS = [
  { name: 'Test Applicant', email: 'applicant@bank.test', role: UserRole.APPLICANT },
  { name: 'Test Reviewer', email: 'reviewer@bank.test', role: UserRole.REVIEWER },
  { name: 'Test Approver', email: 'approver@bank.test', role: UserRole.APPROVER },
  { name: 'Test Admin', email: 'admin@bank.test', role: UserRole.ADMIN },
] as const;

async function seedUsers(hashedPassword: string) {
  return Promise.all(
    SEED_USERS.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: { 
          name: user.name, 
          role: user.role, 
          password: hashedPassword 
        },
        create: { 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          password: hashedPassword 
        },
      })
    )
  );
}

async function main() {

  // 10 salt round encryption for password hashing
  const hashedPassword = await bcrypt.hash(DEVELOPMENT_PASSWORD, 10);

  await prisma.$connect();

  try {
    const results = await seedUsers(hashedPassword);
    console.log(`Successfully seeded ${results.length} users.`);
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