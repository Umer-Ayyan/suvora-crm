import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const body =
      await req.json();

    const user =
      await prisma.user.findUnique({
        where: {
          employeeId:
            (
              session.user as any
            ).employeeId,
        },
      });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const activity =
      await prisma.leadActivity.create(
        {
          data: {
            note: body.note,
            leadId: id,
            userId: user.id,
          },
        }
      );

    return NextResponse.json(
      activity
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to create activity",
      },
      {
        status: 500,
      }
    );
  }
}