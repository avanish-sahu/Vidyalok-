import { getAllSubjects } from "@/lib/subjects";

export async function GET() {
  const subjects = await getAllSubjects();
  return Response.json({ subjects });
}
