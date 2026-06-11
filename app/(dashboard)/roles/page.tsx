import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RolesManager from "@/components/roles/roles-manager";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const roles = await prisma.customRole.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });

  const employees = await prisma.user.findMany({
    select: { id: true, name: true, employeeId: true, role: true, customRoleId: true, designation: true },
    orderBy: { name: "asc" },
  });

  return <RolesManager roles={roles as any} employees={employees} />;
}
