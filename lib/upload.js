import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = {
  notes: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"],
  dpp: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
  lecture: [".mp4", ".mov", ".webm", ".mkv", ".pdf"],
  testseries: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
};

const MAX_SIZE_BYTES = {
  notes: 25 * 1024 * 1024,
  dpp: 25 * 1024 * 1024,
  lecture: 300 * 1024 * 1024,
  testseries: 25 * 1024 * 1024,
};

export function validateFile(file, type) {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS[type]?.includes(ext)) {
    return `File type ${ext || "unknown"} is not allowed for ${type}.`;
  }
  if (file.size > MAX_SIZE_BYTES[type]) {
    return `File is too large. Max size for ${type} is ${MAX_SIZE_BYTES[type] / (1024 * 1024)}MB.`;
  }
  return null;
}

export async function saveUploadedFile(file, subjectSlug, type) {
  const ext = path.extname(file.name);
  const safeBase = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  const filename = `${Date.now()}-${safeBase}${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", subjectSlug, type);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    fileUrl: `/uploads/${subjectSlug}/${type}/${filename}`,
    originalName: file.name,
  };
}
