import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const notes = await prisma.leadNote.findMany({
      where: { leadId: id },
      include: { user: { select: { name: true, employeeId: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    if (!body.content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { employeeId: (session.user as any).employeeId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const note = await prisma.leadNote.create({
      data: { content: body.content.trim(), leadId: id, userId: user.id },
      include: { user: { select: { name: true, employeeId: true } } },
    });

    await prisma.activityLog.create({
      data: { action: "NOTE_ADDED", description: `${user.name} added a note to lead`, userId: user.id },
    });

    return NextResponse.json(note);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { noteId } = await req.json();
    if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

    await prisma.leadNote.delete({ where: { id: noteId, leadId: id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
