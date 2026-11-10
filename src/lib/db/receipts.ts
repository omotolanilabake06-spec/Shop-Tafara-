// Payment receipts customers upload at checkout. They hold bank details, so they live in the private
// "receipts" bucket and the admin opens them through links that expire after an hour.
import { db } from "./supabase";

const BUCKET = "receipts";
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const RECEIPT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

/** Checks a receipt before the order is saved. Returns an error message, or null when it's fine. */
export function receiptProblem(file: File) {
  if (!RECEIPT_TYPES[file.type]) return "Please upload your receipt as a photo, screenshot or PDF.";
  if (file.size > MAX_RECEIPT_BYTES) return "That receipt is over 5 MB. Please upload a screenshot instead.";
  return null;
}

/** Saves a receipt and returns its path in the bucket. */
export async function saveReceipt(file: File) {
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${RECEIPT_TYPES[file.type]}`;
  const { error } = await db().storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Your receipt couldn't be saved (${error.message}). Please try again.`);
  return path;
}

/** A one-hour link for the admin to view a receipt. */
export async function receiptUrl(path: string) {
  const { data } = await db().storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const isPdf = (path: string) => path.endsWith(".pdf");
