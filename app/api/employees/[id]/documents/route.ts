import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["admin", "manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const docs = await prisma.employeeDocument.findMany({
    where: { userId: id },
    select: {
      id: true, name: true, category: true,
      fileName: true, fileType: true, fileSize: true,
      notes: true, uploadedAt: true,
      // Do NOT include fileData in list — only on download
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["admin", "manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Check employee exists
  const emp = await prisma.user.findUnique({ where: { id } });
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const body = await req.json();
  const { name, category, fileName, fileType, fileSize, fileData, notes } = body;

  if (!name || !fileName || !fileType || !fileData)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  // 10MB limit (base64 ~13.3MB)
  if (fileSize > 10 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const doc = await prisma.employeeDocument.create({
    data: {
      userId: id,
      name: name || fileName,
      category: category || "other",
      fileName,
      fileType,
      fileSize,
      fileData,
      notes: notes || null,
    },
  });

  return NextResponse.json({ id: doc.id, name: doc.name, category: doc.category, fileName: doc.fileName, fileType: doc.fileType, fileSize: doc.fileSize, uploadedAt: doc.uploadedAt });
}
