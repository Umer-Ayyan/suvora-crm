import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session =
    await getMobileOrWebSession(req, authOptions);

  if (
    (session?.user as any)
      ?.role !== "admin"
  ) {
    return NextResponse.json(
      {
        error: "Forbidden",
      },
      {
        status: 403,
      }
    );
  }

  const { id } =
    await context.params;

  await prisma.leadActivity.delete(
    {
      where: {
        id,
      },
    }
  );

  return NextResponse.json({
    success: true,
  });
}