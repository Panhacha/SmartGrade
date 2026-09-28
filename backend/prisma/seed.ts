import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create user
  await prisma.user.create({
    data: {
      name: 'Teacher Admin',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'TEACHER',
    },
  });

  // Create subject
  await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH101',
    },
  });

  // Create students
  await prisma.student.createMany({
    data: [
      { student_code: 'S001', name: 'Alice Smith', class_name: '10A', section: 'A' },
      { student_code: 'S002', name: 'Bob Jones', class_name: '10A', section: 'A' },
    ],
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
