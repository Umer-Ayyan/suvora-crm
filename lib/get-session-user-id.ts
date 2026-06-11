import { prisma } from "@/lib/prisma";

// Resolves the real DB user ID from a session, even if session.user.id is missing
// Falls back to looking up by employeeId
export async function getSessionUserId(session: any): Promise<string | null> {
  const id = session?.user?.id;
  if (id) return id;

  // Fallback: look up by employeeId (always present in session)
  const employeeId = session?.user?.employeeId;
  if (!employeeId) return null;

  const user = await prisma.user.findUnique({
    where: { employeeId },
    select: { id: true },
  });
  return user?.id ?? null;
}
