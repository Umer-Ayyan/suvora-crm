import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/employees/[id]/documents/[docId] — download file
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["admin", "manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { docId } = await params;
  const doc = await prisma.employeeDocument.findUnique({ where: { id: docId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return base64 data for client-side download
  return NextResponse.json({
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileData: doc.fileData,
  });
}

// DELETE /api/employees/[id]/documents/[docId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { docId } = await params;
  await prisma.employeeDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
