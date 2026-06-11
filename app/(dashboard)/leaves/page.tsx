import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeavesClient from "@/components/leaves/leaves-client";

export default async function LeavesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const role   = (session.user as any).role;
  const isPrivileged = ["admin", "manager"].includes(role);

  const where = isPrivileged ? {} : { userId };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user:       { select: { id: true, name: true, employeeId: true, designation: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return (
    <LeavesClient
      leaves={leaves as any}
      currentUserId={userId}
      isPrivileged={isPrivileged}
    />
  );
}
