import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";

const DEFAULT_SUBJECTS = [
  { name: "Maths", slug: "maths" },
  { name: "English", slug: "english" },
  { name: "Physics", slug: "physics" },
  { name: "Chemistry", slug: "chemistry" },
  { name: "Social Science", slug: "social-science" },
  { name: "Hindi", slug: "hindi" },
];

export async function getAllSubjects() {
  await connectDB();
  const count = await Subject.countDocuments();
  if (count === 0) {
    await Subject.insertMany(DEFAULT_SUBJECTS);
  }
  return Subject.find().sort({ name: 1 }).lean();
}
