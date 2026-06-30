import { connectDB } from "@/lib/db";
import Class from "@/models/Class";

const DEFAULT_CLASSES = [
  { name: "Class 8", slug: "class-8", order: 8 },
  { name: "Class 9", slug: "class-9", order: 9 },
  { name: "Class 10", slug: "class-10", order: 10 },
];

export async function getAllClasses() {
  await connectDB();
  const count = await Class.countDocuments();
  if (count === 0) {
    await Class.insertMany(DEFAULT_CLASSES);
  }
  return Class.find().sort({ order: 1 }).lean();
}
