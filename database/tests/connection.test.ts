import "dotenv/config";
import { prisma, checkDatabaseConnection } from "../src";

async function runDatabaseTests() {
  console.log("--- 1. Testing Raw Database Connectivity ---");
  const connection = await checkDatabaseConnection();
  if (!connection.connected) {
    console.error("FAIL: Could not connect to database:", connection.error);
    process.exit(1);
  }
  console.log(`PASS: Connected to PostgreSQL database in ${connection.latencyMs}ms`);

  console.log("\n--- 2. Testing Write Operation (Create User) ---");
  const testEmail = `test_${Date.now()}@insightignite.org`;
  const createdUser = await prisma.user.create({
    data: {
      email: testEmail,
      fullName: "Database Foundation Test User",
      role: "LEARNER",
    },
  });
  console.log(`PASS: Successfully created user: ${createdUser.id} (${createdUser.email})`);

  console.log("\n--- 3. Testing Read Operation ---");
  const fetchedUser = await prisma.user.findUnique({
    where: { id: createdUser.id },
  });
  if (!fetchedUser || fetchedUser.email !== testEmail) {
    console.error("FAIL: Fetched user does not match created user!");
    process.exit(1);
  }
  console.log(`PASS: Successfully read user: ${fetchedUser.fullName} [role: ${fetchedUser.role}]`);

  console.log("\n--- 4. Testing Related Write (Contact Inquiry) ---");
  const createdInquiry = await prisma.contactInquiry.create({
    data: {
      name: "Inquiry Test User",
      email: testEmail,
      inquiryType: "parenting",
      message: "Testing database inquiry creation in Phase 2 foundation.",
    },
  });
  console.log(`PASS: Successfully created contact inquiry: ${createdInquiry.id}`);

  console.log("\n--- 5. Testing Update Operation ---");
  const updatedInquiry = await prisma.contactInquiry.update({
    where: { id: createdInquiry.id },
    data: { status: "IN_PROGRESS" },
  });
  if (updatedInquiry.status !== "IN_PROGRESS") {
    console.error("FAIL: Status was not updated!");
    process.exit(1);
  }
  console.log(`PASS: Successfully updated inquiry status to ${updatedInquiry.status}`);

  console.log("\n--- 6. Testing Cleanup / Delete Operations ---");
  await prisma.contactInquiry.delete({ where: { id: createdInquiry.id } });
  await prisma.user.delete({ where: { id: createdUser.id } });

  const verifyUserDeleted = await prisma.user.findUnique({ where: { id: createdUser.id } });
  const verifyInquiryDeleted = await prisma.contactInquiry.findUnique({ where: { id: createdInquiry.id } });

  if (verifyUserDeleted || verifyInquiryDeleted) {
    console.error("FAIL: Cleanup did not remove test records!");
    process.exit(1);
  }
  console.log("PASS: Cleaned up all test records successfully.");

  console.log("\nAll Database CRUD operations completed with 100% SUCCESS.");
  await prisma.$disconnect();
}

runDatabaseTests().catch(async (error) => {
  console.error("FATAL: Database test error:", error);
  await prisma.$disconnect();
  process.exit(1);
});
