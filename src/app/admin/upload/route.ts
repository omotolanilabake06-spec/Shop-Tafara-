import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";
import { saveImage } from "@/lib/db/media";

/** One image per request. The browser resizes photos before sending, so uploads stay small. */
export async function POST(request: Request) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  try {
    return Response.json({ url: await saveImage(file) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
