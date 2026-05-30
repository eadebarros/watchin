import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true, image: true, email: true },
  });

  return NextResponse.json(user);
}
