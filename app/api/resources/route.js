import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Resource from "@/models/Resource";
import { validateFile, saveUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const type = searchParams.get("type");
  if (!subject) {
    return Response.json({ error: "subject is required." }, { status: 400 });
  }

  await connectDB();
  const filter = { subject };
  if (type) filter.type = type;

  const resources = await Resource.find(filter).sort({ createdAt: -1 }).lean();
  return Response.json({ resources });
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can upload resources." }, { status: 403 });
  }

  const formData = await request.formData();
  const subject = formData.get("subject");
  const type = formData.get("type");
  const title = formData.get("title");
  const description = formData.get("description") || "";
  const file = formData.get("file");

  if (!subject || !type || !title || !file) {
    return Response.json({ error: "subject, type, title and file are required." }, { status: 400 });
  }
  if (!["notes", "dpp", "lecture", "testseries"].includes(type)) {
    return Response.json({ error: "Invalid resource type." }, { status: 400 });
  }

  await connectDB();
  const User = (await import("@/models/User")).default;
  const user = await User.findById(session.id).lean();
  if (!user || user.status !== "approved") {
    return Response.json({ error: "Your teacher account is not approved." }, { status: 403 });
  }
  if (!user.subjects?.includes(subject)) {
    return Response.json({ error: "You are not assigned to this subject." }, { status: 403 });
  }

  const validationError = validateFile(file, type);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { fileUrl, originalName } = await saveUploadedFile(file, subject, type);

  const resource = await Resource.create({
    subject,
    type,
    title,
    description,
    fileUrl,
    originalName,
    uploadedBy: user._id,
    uploadedByName: user.name,
  });

  return Response.json({ resource });
}
