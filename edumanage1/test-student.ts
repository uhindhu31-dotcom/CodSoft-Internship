
import { prisma } from "./lib/prisma";

async function main() {
  const student = await prisma.student.create({
    data: {
      name: "Test Student",
      email: "test.student@example.com",
      rollNo: "TEST001",
      department: "Computer Science",
      year: 2,
    },
  });

  console.log("Student created successfully:");
  console.log(student);
}

main()
  .catch((error) => {
    console.error("Test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
