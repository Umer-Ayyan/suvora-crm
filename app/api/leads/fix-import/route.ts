import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-time fix: clears dealValue and budget from csv_import leads
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count } = await prisma.lead.updateMany({
    where: { source: "csv_import" },
    data: { dealValue: null, budget: null },
  });

  return NextResponse.json({ fixed: count });
}
