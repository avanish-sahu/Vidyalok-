import { unlink } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Resource from "@/models/Resource";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can edit resources." }, { status: 403 });
  }

  const { id } = await params;
  const { title, description } = await request.json();
  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  await connectDB();
  const resource = await Resource.findById(id);
  if (!resource) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }
  if (resource.uploadedBy.toString() !== session.id) {
    return Response.json({ error: "You can only edit your own uploads." }, { status: 403 });
  }

  resource.title = title;
  resource.description = description || "";
  await resource.save();

  return Response.json({ resource });
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can delete resources." }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();
  const resource = await Resource.findById(id);
  if (!resource) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }
  if (resource.uploadedBy.toString() !== session.id) {
    return Response.json({ error: "You can only delete your own uploads." }, { status: 403 });
  }

  await Resource.deleteOne({ _id: id });

  const filePath = path.join(process.cwd(), "public", resource.fileUrl);
  await unlink(filePath).catch(() => {});

  return Response.json({ ok: true });
}
