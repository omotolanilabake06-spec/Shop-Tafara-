"use server";

import { addSubscriber } from "@/lib/db/newsletter";

export type SignupState = { ok?: boolean; error?: string };

// Starts with a letter or number, which also keeps formulas out of the spreadsheet export.
const EMAIL = /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export async function signUp(_: SignupState, form: FormData): Promise<SignupState> {
  // Hidden from people; bots that fill it in are quietly told they succeeded.
  if (form.get("company")) return { ok: true };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const firstName = String(form.get("firstName") ?? "").trim().replace(/^[=+\-@]+/, "").slice(0, 80);
  if (email.length > 254 || !EMAIL.test(email)) return { error: "Please enter a valid email address." };

  try {
    await addSubscriber(email, firstName, "popup");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { error: "Something went wrong. Please try again." };
  }
}
