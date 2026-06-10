import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
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
            "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await params;

    const body =
      await req.json();

    // salary update (no password needed)
    if (body.salary !== undefined && !body.password) {
      await prisma.user.update({
        where: { id },
        data: { salary: Number(body.salary) },
      });
      return NextResponse.json({ success: true });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to update password",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: Request,
  {
    params,
  }: {
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
            "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await params;

    const employee =
      await prisma.user.findUnique(
        {
          where: { id },
        }
      );

    if (!employee) {
      return NextResponse.json(
        {
          error:
            "Employee not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      employee.role === "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete admin",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to delete employee",
      },
      {
        status: 500,
      }
    );
  }
}