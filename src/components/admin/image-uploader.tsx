"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Colour, ColourKey, ProductImage } from "@/lib/types";
import { button, input } from "./ui";

export type UploadedImage = ProductImage;

const MAX_EDGE = 2400;

/** Shrinks large photos in the browser so uploads are quick and stay under hosting limits. */
async function prepare(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 2_500_000 && file.type !== "image/png") return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.88));
}

async function upload(file: File) {
  const blob = await prepare(file);
  const body = new FormData();
  body.append("file", new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: blob.type || "image/jpeg" }));
  const res = await fetch("/admin/upload", { method: "POST", body });
  const json = await res.json().catch(() => ({ error: "Upload failed. Please try again." }));
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
  return json.url as string;
}

export function ImageUploader({
  images,
  onChange,
  multiple = true,
  aspect = "aspect-[2/3]",
  defaultAlt = "",
  colourOptions,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  aspect?: string;
  defaultAlt?: string;
  /** Clothing: the product's colours, so each photo can be tied to the colour it shows. */
  colourOptions?: Colour[];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Latest list, so uploads that finish one after another don't overwrite each other.
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  });

  async function add(files: FileList | File[]) {
    setError(null);
    const list = [...files].slice(0, multiple ? 12 : 1);
    setBusy((n) => n + list.length);
    for (const file of list) {
      try {
        const src = await upload(file);
        const next = multiple ? [...latest.current, { src, alt: defaultAlt }] : [{ src, alt: defaultAlt }];
        latest.current = next;
        onChange(next);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      {images.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.src} className="rounded-[4px] border border-line bg-paper p-2">
              <div className={`relative ${aspect} overflow-hidden rounded-[2px] bg-stone`}>
                <Image src={img.src} alt="" fill sizes="200px" className="object-cover" />
                {i === 0 && multiple && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-medium text-paper">Main photo</span>
                )}
              </div>
              <input
                value={img.alt}
                onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                placeholder="Describe the photo"
                aria-label={`Description for photo ${i + 1}`}
                className={`${input} mt-2 h-9 text-[14px]`}
              />
              {colourOptions && colourOptions.length > 1 && (
                <select
                  value={img.colour && colourOptions.some((c) => c.key === img.colour) ? img.colour : ""}
                  onChange={(e) =>
                    onChange(images.map((x, j) => (j === i ? { src: x.src, alt: x.alt, ...(e.target.value ? { colour: e.target.value as ColourKey } : {}) } : x)))
                  }
                  aria-label={`Colour shown in photo ${i + 1}`}
                  className={`${input} mt-2 h-9 text-[14px]`}
                >
                  <option value="">Shows: any colour</option>
                  {colourOptions.map((c) => (
                    <option key={c.key} value={c.key}>
                      Shows: {c.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="mt-2 flex items-center justify-between text-[14px]">
                {multiple ? (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded px-2 py-1 hover:bg-stone disabled:opacity-30" aria-label="Move earlier">
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      disabled={i === images.length - 1}
                      className="rounded px-2 py-1 hover:bg-stone disabled:opacity-30"
                      aria-label="Move later"
                    >
                      →
                    </button>
                  </span>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="rounded px-2 py-1 text-sold hover:bg-[#fcf4f2]">
                  Remove
                </button>
              </div>
              {multiple && i > 0 && (
                <button type="button" onClick={() => move(i, 0)} className="mt-1 w-full rounded py-1 text-[14px] text-soft hover:bg-stone hover:text-ink">
                  Make main photo
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {(multiple || images.length === 0) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) add(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center rounded-[4px] border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragging ? "border-ink bg-stone" : "border-[#d6cfc5] bg-[#faf8f5]"
          }`}
        >
          <p className="text-[15px] font-medium">{busy ? `Uploading ${busy} ${busy === 1 ? "photo" : "photos"}…` : "Drag photos here"}</p>
          <p className="mt-1 text-[14px] text-soft">JPG, PNG or WebP. Portrait 2:3 looks best, at least 1600px tall.</p>
          <button type="button" onClick={() => fileInput.current?.click()} className={`${button.secondary} mt-4`} disabled={busy > 0}>
            Choose {multiple ? "photos" : "a photo"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple={multiple}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && <p className="mt-2 text-[14px] font-medium text-sold">{error}</p>}
    </div>
  );
}
