import bcrypt from "bcryptjs";
import { prisma } from "../database/src";

async function testPassword() {
  const user = await prisma.user.findUnique({
    where: { email: "axaymathukiya15@gmail.com" },
  });
  if (!user || !user.passwordHash) {
    console.log("No user or no passwordHash found for axaymathukiya15@gmail.com");
    return;
  }
  const match = await bcrypt.compare("Akshay@12@658", user.passwordHash);
  console.log("Password match for 'Akshay@12@658':", match);
  await prisma.$disconnect();
}

testPassword().catch(console.error);
