import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword =
    await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      employeeId: "SV001",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("Admin created");
}

main();