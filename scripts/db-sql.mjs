// Runs a SQL file against the Supabase project through the Management API.
// Usage: pnpm db:sql supabase/schema.sql   (needs SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL)
import { readFile } from "node:fs/promises";

const [file] = process.argv.slice(2);
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
if (!file) throw new Error("Pass a SQL file, e.g. pnpm db:sql supabase/schema.sql");
if (!token || !ref) throw new Error("Set SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL in .env.local");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: await readFile(file, "utf8") }),
});
const body = await res.text();
if (!res.ok) {
  console.error(`Failed (${res.status}): ${body}`);
  process.exit(1);
}
console.log(`Ran ${file}${body && body !== "[]" ? `\n${body}` : ""}`);
