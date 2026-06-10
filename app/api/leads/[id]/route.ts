import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const user =
      await prisma.user.findUnique(
        {
          where: {
            employeeId:
              (
                session.user as any
              ).employeeId,
          },
        }
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const lead =
      await prisma.lead.findUnique(
        {
          where: {
            id,
          },
        }
      );

    if (!lead) {
      return NextResponse.json(
        {
          error:
            "Lead not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      user.role !== "admin" &&
      lead.createdById !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await req.json();

    const updatedLead =
      await prisma.lead.update({
        where: {
          id,
        },
        data: {
          ...(body.status && {
            status:
              body.status,
          }),

          ...(body.priority && {
            priority:
              body.priority,
          }),

          ...(body.followUpDate !==
            undefined && {
            followUpDate:
              body.followUpDate
                ? new Date(
                    body.followUpDate
                  )
                : null,
          }),

          ...(body.createdById !==
            undefined && {
            createdById:
              body.createdById,
          }),
        },
      });

    // Status Change
    if (
  body.status &&
  body.status !== lead.status
) {
  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      description: `${user.name} changed "${updatedLead.name}" status to ${body.status}`,
      userId: user.id,
    },
  });

  await prisma.leadActivity.create({
    data: {
      note: `Status changed to ${body.status}`,
      leadId: lead.id,
      userId: user.id,
    },
  });
}

    // Priority Change
   if (
  body.priority &&
  body.priority !== lead.priority
) {
  await prisma.activityLog.create({
    data: {
      action: "PRIORITY_CHANGED",
      description: `${user.name} changed "${updatedLead.name}" priority to ${body.priority}`,
      userId: user.id,
    },
  });

  await prisma.leadActivity.create({
    data: {
      note: `Priority changed to ${body.priority}`,
      leadId: lead.id,
      userId: user.id,
    },
  });
}

    // Follow-up Update
   if (
  body.followUpDate !== undefined &&
  String(lead.followUpDate || "") !==
    String(body.followUpDate || "")
) {
  await prisma.activityLog.create({
    data: {
      action: "FOLLOWUP_UPDATED",
      description: `${user.name} updated follow-up date for "${updatedLead.name}"`,
      userId: user.id,
    },
  });

  await prisma.leadActivity.create({
    data: {
      note: body.followUpDate
        ? `Follow-up date updated to ${body.followUpDate}`
        : "Follow-up date removed",
      leadId: lead.id,
      userId: user.id,
    },
  });
}
    // Reassignment
    if (
  body.createdById !== undefined &&
  body.createdById !==
    lead.createdById
) {
      const assignedUser =
        await prisma.user.findUnique(
          {
            where: {
              id: body.createdById,
            },
          }
        );

        await prisma.leadActivity.create({
  data: {
    note: `Lead reassigned to ${assignedUser?.name}`,
    leadId: lead.id,
    userId: user.id,
  },
});

      await prisma.activityLog.create(
        {
          data: {
            action:
              "LEAD_REASSIGNED",

            description: `${user.name} reassigned "${updatedLead.name}" to ${assignedUser?.name}`,

            userId: user.id,
          },
        }
      );
    }

    return NextResponse.json(
      updatedLead
    );
  } catch (error) {
    console.error(
      "PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update lead",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (
      (session?.user as any)
        ?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const lead =
      await prisma.lead.findUnique(
        {
          where: {
            id,
          },
        }
      );

    await prisma.lead.delete({
      where: {
        id,
      },
    });

    await prisma.activityLog.create({
      data: {
        action:
          "LEAD_DELETED",

        description: `${(session?.user as any)?.name} deleted lead "${lead?.name}"`,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete lead",
      },
      {
        status: 500,
      }
    );
  }
}