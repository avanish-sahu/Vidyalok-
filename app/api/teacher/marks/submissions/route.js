import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import MarksSubmission from "@/models/MarksSubmission";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can view this." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const classSlug = searchParams.get("class");

  await connectDB();
  const filter = { teacher: session.id };
  if (subject) filter.subject = subject;
  if (classSlug) filter.class = classSlug;

  const submissions = await MarksSubmission.find(filter).sort({ date: -1 }).lean();

  return Response.json({ submissions });
}
