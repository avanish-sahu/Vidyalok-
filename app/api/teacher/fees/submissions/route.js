import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FeesSubmission from "@/models/FeesSubmission";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can view this." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classSlug = searchParams.get("class");

  await connectDB();
  const filter = { teacher: session.id };
  if (classSlug && classSlug !== "all") filter.class = classSlug;

  const submissions = await FeesSubmission.find(filter).sort({ submittedAt: -1 }).lean();

  return Response.json({ submissions });
}
