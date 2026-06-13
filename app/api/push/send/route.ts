import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse, after } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { notify } from "@/lib/push";

// POST /api/push/send  (admin / manager)
// {
//   title, message,
//   target: "all" | "employees" | "department" | "users",
//   department?: string,        // when target === "department"
//   userIds?: string[],         // when target === "users"
//   link?: string
// }
export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "admin" && role !== "manager")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const title = body.title?.trim();
    const message = body.message?.trim();
    const target = body.target || "all";
    const link = body.link?.trim() || undefined;
    if (!title || !message)
      return NextResponse.json({ error: "Title and message required" }, { status: 400 });

    let where: any = {};
    if (target === "all") {
      where = {};
    } else if (target === "employees") {
      where = { role: { in: ["employee", "manager"] } };
    } else if (target === "department") {
      if (!body.department)
        return NextResponse.json({ error: "Department required" }, { status: 400 });
      where = { department: body.department };
    } else if (target === "users") {
      const ids: string[] = Array.isArray(body.userIds) ? body.userIds : [];
      if (!ids.length)
        return NextResponse.json({ error: "userIds required" }, { status: 400 });
      where = { id: { in: ids } };
    } else {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const users = await prisma.user.findMany({ where, select: { id: true } });
    const userIds = users.map((u) => u.id);

    after(() => notify(userIds, { title, message, type: "announcement", link, data: { type: "broadcast" } }));

    return NextResponse.json({ ok: true, sentTo: userIds.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
