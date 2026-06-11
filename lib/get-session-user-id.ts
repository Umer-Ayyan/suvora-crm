// Fast path: id is always in the JWT (set in auth.ts session callback).
// The old DB fallback via employeeId added a full round-trip on every request — removed.
export async function getSessionUserId(session: any): Promise<string | null> {
  return (session?.user?.id as string | undefined) ?? null;
}
