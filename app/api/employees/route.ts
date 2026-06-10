import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(
  req: NextRequest
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (
      (session?.user as any)?.role !==
      "admin"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const body = await req.json();

    const hashedPassword =
      await bcrypt.hash(
        body.password,
        10
      );

    const employees =
  await prisma.user.findMany({
    select: {
      employeeId: true,
    },
  });

const empNumbers = employees
  .filter((e) =>
    e.employeeId.startsWith("EMP")
  )
  .map((e) =>
    Number(
      e.employeeId.replace(
        "EMP",
        ""
      )
    )
  )
  .filter((n) => !isNaN(n));

const highestNumber =
  empNumbers.length > 0
    ? Math.max(...empNumbers)
    : 0;

const nextEmployeeId = `EMP${String(
  highestNumber + 1
).padStart(3, "0")}`;
    const employee =
      await prisma.user.create({
        data: {
          name: body.name,
          employeeId: nextEmployeeId,
          password: hashedPassword,
          role: body.role === "manager" ? "manager" : "employee",
          salary: Number(body.salary) || 0,
        },
      });

    return NextResponse.json(
      employee
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to create employee",
      },
      {
        status: 500,
      }
    );
  }
}