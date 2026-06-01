import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session =
      await getServerSession(authOptions);

    const user = await prisma.user.findUnique({
      where: {
        employeeId: (session?.user as any)
          ?.employeeId,
      },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    let leads;

    if (user.role === "admin") {
      leads = await prisma.lead.findMany({
        include: {
          createdBy: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      leads = await prisma.lead.findMany({
        where: {
          createdById: user.id,
        },

        include: {
          createdBy: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(leads);
  } catch (error) {
    console.error(
      "LEADS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const session =
      await getServerSession(authOptions);

    const user = await prisma.user.findUnique({
      where: {
        employeeId: (session?.user as any)
          ?.employeeId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const lead = await prisma.lead.create({
      data: {
  name: body.name,
  source: body.source,
  company: body.company,
  email: body.email,
  budget: body.budget,
  notes: body.notes,

  followUpDate:
    body.followUpDate
      ? new Date(
          body.followUpDate
        )
      : null,

  priority:
    body.priority ||
    "medium",

  status: "new",

  createdById: user.id,
},

      include: {
        createdBy: true,
      },
    });

    await prisma.activityLog.create({
  data: {
    action: "LEAD_CREATED",

    description: `${user.name} created lead "${lead.name}"`,

    userId: user.id,
  },
});

    return NextResponse.json(lead);
  } catch (error) {
    console.error(
      "CREATE LEAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}