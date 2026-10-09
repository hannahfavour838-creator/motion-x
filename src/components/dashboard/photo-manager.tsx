"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createImageUpload, deleteImage, registerImage, reorderImages } from "@/app/actions/seller";
import { useToast } from "@/components/ui/toast";
import { uploadLimits } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/format";
import type { VehicleImage } from "@/lib/types";

interface UploadItem { key: string; name: string; progress: number; error?: string }

function putWithProgress(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    if (publicEnv.supabaseKey) xhr.setRequestHeader("apikey", publicEnv.supabaseKey);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

async function dimensions(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const d = { width: bmp.width, height: bmp.height };
    bmp.close();
    return d;
  } catch {
    return {};
  }
}

export function PhotoManager({ vehicleId, images, title }: { vehicleId: string; images: VehicleImage[]; title: string }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [order, setOrder] = useState(images.map((i) => i.id));
  const [pending, start] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const byId = new Map(images.map((i) => [i.id, i]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as VehicleImage[];
  // Keep order in sync when the server adds images.
  const missing = images.filter((i) => !order.includes(i.id));
  if (missing.length) setOrder((o) => [...o, ...missing.map((m) => m.id)]);

  const remaining = uploadLimits.maxImagesPerListing - images.length;

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length > remaining) {
      toast(`You can add ${remaining} more photo${remaining === 1 ? "" : "s"} to this listing.`, "error");
      list.splice(remaining);
    }
    for (const file of list) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      const setItem = (patch: Partial<UploadItem>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...patch } : x)));
      setUploads((u) => [...u, { key, name: file.name, progress: 0 }]);
      if (!(uploadLimits.allowedImageTypes as readonly string[]).includes(file.type)) {
        setItem({ error: "Unsupported format — use JPEG, PNG, WebP or AVIF." });
        continue;
      }
      if (file.size > uploadLimits.maxImageBytes) {
        setItem({ error: `Too large — maximum ${uploadLimits.maxImageBytes / 1024 / 1024} MB.` });
        continue;
      }
      try {
        const dims = await dimensions(file);
        const ticket = await createImageUpload(vehicleId, { type: file.type, size: file.size });
        if (!ticket.ok || !ticket.data) throw new Error(ticket.message);
        await putWithProgress(ticket.data.signedUrl, file, (p) => setItem({ progress: p }));
        const reg = await registerImage(vehicleId, ticket.data.path, { ...dims, alt: `${title} — photo` });
        if (!reg.ok) throw new Error(reg.message);
        setUploads((u) => u.filter((x) => x.key !== key));
      } catch (err) {
        setItem({ error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    router.refresh();
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    start(async () => {
      const r = await reorderImages(vehicleId, next);
      if (!r.ok) toast(r.message ?? "Couldn't save order.", "error");
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("Remove this photo?")) return;
    start(async () => {
      const r = await deleteImage(id);
      toast(r.message ?? "", r.ok ? "success" : "error");
      if (r.ok) {
        setOrder((o) => o.filter((x) => x !== id));
        router.refresh();
      }
    });
  };

  return (
    <section aria-labelledby="photos-title" className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="photos-title" className="font-display text-xl uppercase">Photographs</h2>
          <p className="mt-1 text-xs text-muted">{images.length} of {uploadLimits.maxImagesPerListing} · JPEG, PNG, WebP or AVIF up to {uploadLimits.maxImageBytes / 1024 / 1024} MB. The first photo is the cover.</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}
        className={cn("flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center transition-colors", dragOver ? "border-electric bg-electric/5" : "border-line-strong")}
      >
        <p className="text-sm text-silver">Drag photos here, or</p>
        <button type="button" disabled={remaining <= 0} onClick={() => input.current?.click()} className="h-10 border border-white px-5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-obsidian disabled:opacity-40">
          Choose files
        </button>
        <input ref={input} type="file" accept={uploadLimits.allowedImageTypes.join(",")} multiple className="sr-only" onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = ""; }} aria-label="Upload photographs" />
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.key} className="border border-line p-3 text-xs">
              <div className="flex justify-between gap-4">
                <span className="truncate text-silver">{u.name}</span>
                <span className={u.error ? "text-danger" : "text-muted"}>{u.error ?? `${u.progress}%`}</span>
              </div>
              {!u.error && (
                <div className="mt-2 h-px w-full bg-line" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                  <div className="h-px bg-electric transition-[width]" style={{ width: `${u.progress}%` }} />
                </div>
              )}
              {u.error && <button type="button" className="mt-2 text-muted underline" onClick={() => setUploads((x) => x.filter((i) => i.key !== u.key))}>Dismiss</button>}
            </li>
          ))}
        </ul>
      )}

      {ordered.length > 0 && (
        <ol className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4", pending && "opacity-70")}>
          {ordered.map((img, i) => (
            <li key={img.id} className="group relative border border-line bg-ink">
              <div className="relative aspect-[3/2]">
                <Image src={img.url} alt={img.alt || `Photo ${i + 1}`} fill sizes="240px" className="object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 bg-obsidian/80 px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white">Cover</span>}
              </div>
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(img.id, -1)} disabled={i === 0} className="h-8 w-8 text-muted hover:text-white disabled:opacity-30" aria-label={`Move photo ${i + 1} earlier`}>←</button>
                  <button type="button" onClick={() => move(img.id, 1)} disabled={i === ordered.length - 1} className="h-8 w-8 text-muted hover:text-white disabled:opacity-30" aria-label={`Move photo ${i + 1} later`}>→</button>
                </div>
                <button type="button" onClick={() => remove(img.id)} className="px-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted hover:text-danger" aria-label={`Remove photo ${i + 1}`}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
