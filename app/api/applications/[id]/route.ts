import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/get-session-user-id";

type Params = { params: Promise<{ id: string }> };

// ── PATCH — update status / notes ────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!["admin", "manager"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const userId = await getSessionUserId(session);
  const { id } = await params;
  const body = await req.json();

  const data: any = { reviewedById: userId };
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;

  const app = await prisma.jobApplication.update({ where: { id }, data });
  return NextResponse.json({ success: true, status: app.status });
}

// ── GET — download CV (base64) ────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!["admin", "manager"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { cvFileName: true, cvFileType: true, cvFileData: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(app);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.jobApplication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
