import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!["admin", "manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { leads } = body; // array of lead objects already mapped

  if (!Array.isArray(leads) || leads.length === 0)
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });

  if (leads.length > 500)
    return NextResponse.json({ error: "Max 500 leads per import" }, { status: 400 });

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      if (!lead.name?.trim()) { skipped++; continue; }

      await prisma.lead.create({
        data: {
          name: lead.name.trim(),
          company: lead.company?.trim() || null,
          email: lead.email?.trim() || null,
          phone: lead.phone?.trim() || null,
          country: lead.country?.trim() || null,
          industry: lead.industry?.trim() || null,
          source: lead.source?.trim() || "csv_import",
          budget: lead.budget?.trim() || null,
          dealValue: lead.dealValue ? parseFloat(lead.dealValue) : null,
          priority: ["high","medium","low"].includes(lead.priority) ? lead.priority : "medium",
          notes: lead.notes?.trim() || null,
          status: "new",
          createdById: userId,
        },
      });
      imported++;
    } catch (e: any) {
      skipped++;
      if (errors.length < 5) errors.push(`Row "${lead.name}": ${e.message}`);
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "LEADS_IMPORTED",
      description: `Imported ${imported} leads from CSV (${skipped} skipped)`,
      userId,
    },
  });

  return NextResponse.json({ imported, skipped, errors });
}
