// Replaces the orders and payments in Supabase with the sample ones. Products are not touched.
// Usage: pnpm db:seed   (asks no questions, so never point it at the live shop's database)
import { resetToSeed } from "../src/lib/db/reset.ts";

await resetToSeed();
console.log("Sample orders and payments loaded into Supabase.");
