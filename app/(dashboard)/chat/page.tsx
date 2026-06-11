import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import ChatApp from "@/components/chat/chat-app";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = await getSessionUserId(session);
  if (!userId) redirect("/login");

  const isAdmin = (session.user as any).role === "admin";

  // All employees for new chat
  const employees = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, name: true, employeeId: true, role: true, designation: true },
    orderBy: { name: "asc" },
  });

  return (
    <ChatApp
      currentUserId={userId}
      currentUserName={(session.user as any).name}
      isAdmin={isAdmin}
      employees={employees}
    />
  );
}
