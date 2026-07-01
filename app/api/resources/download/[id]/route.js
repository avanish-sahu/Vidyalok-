import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Resource from "@/models/Resource";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) {
    return new Response("Not authenticated.", { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return new Response("Resource ID is required.", { status: 400 });
  }

  await connectDB();
  const resource = await Resource.findById(id).lean();
  if (!resource) {
    return new Response("Resource not found.", { status: 404 });
  }

  if (!resource.fileData) {
    return new Response("Resource file data not found.", { status: 404 });
  }

  // resource.fileData is retrieved as a Buffer or Binary object.
  // In Next.js/Node runtime, Buffer is directly supported in Response constructor.
  const data = Buffer.from(resource.fileData.buffer || resource.fileData);

  return new Response(data, {
    headers: {
      "Content-Type": resource.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(resource.originalName)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
