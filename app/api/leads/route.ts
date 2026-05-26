import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      source: body.source,
      status: "new",
    },
  });

  return NextResponse.json(lead);
}