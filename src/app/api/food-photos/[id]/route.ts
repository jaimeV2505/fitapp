import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { readFoodPhoto } from "@/modules/nutrition/photo-service";

export const dynamic = "force-dynamic";

/** Serves a meal photo to its owner only. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });

  const photo = await readFoodPhoto(user.id, id);
  if (!photo) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(photo.body), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
