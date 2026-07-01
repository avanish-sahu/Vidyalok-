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
  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    fileData: buffer,
    contentType: file.type || "application/octet-stream",
    originalName: file.name,
  };
}
