import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { employeeId: "EMP-001" },
    update: {},
    create: { name: "Admin", employeeId: "EMP-001", password: hash, role: "admin" },
  });
  console.log("Admin ready:", user.name, user.employeeId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
