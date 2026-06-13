import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
// ── POST — public, no auth ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, position, linkedin, coverLetter, cvFileName, cvFileType, cvFileData, cvFileSize } = body;

    if (!name?.trim() || !email?.trim() || !position?.trim() || !cvFileData || !cvFileName) {
      return NextResponse.json({ error: "Name, email, position and CV are required" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // CV size limit 5 MB
    if (cvFileSize > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "CV must be under 5 MB" }, { status: 400 });
    }

    const app = await prisma.jobApplication.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        position: position.trim(),
        linkedin: linkedin?.trim() || null,
        coverLetter: coverLetter?.trim() || null,
        cvFileName,
        cvFileType,
        cvFileData,
        cvFileSize,
      },
    });

    return NextResponse.json({ success: true, id: app.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

// ── GET — admin/manager only ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!["admin", "manager"].includes((session?.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const apps = await prisma.jobApplication.findMany({
      where: status && status !== "all" ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, position: true,
        linkedin: true, coverLetter: true, cvFileName: true, cvFileType: true,
        cvFileSize: true, status: true, notes: true, createdAt: true,
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(apps);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
