// Product and collection photos, stored in the public "media" bucket in Supabase Storage.
import { db } from "./supabase";

const BUCKET = "media";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Uploads one photo and returns its public URL. File names are random, so they can be cached forever. */
export async function saveImage(file: File) {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That image is over 8 MB. Please use a smaller file.");
  const name = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await db()
    .storage.from(BUCKET)
    .upload(name, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`The photo couldn't be saved (${error.message}). Please try again.`);
  return db().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}
