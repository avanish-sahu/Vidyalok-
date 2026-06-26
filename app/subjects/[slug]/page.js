import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Resource from "@/models/Resource";
import StudentLayout from "@/app/components/StudentLayout";
import BackLink from "@/app/components/BackLink";
import ResourceTabs from "./ResourceTabs";

function serialize(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    type: doc.type,
    fileUrl: doc.fileUrl,
    originalName: doc.originalName,
    uploadedByName: doc.uploadedByName,
    createdAt: doc.createdAt.toISOString(),
  };
}

export default async function SubjectDetailPage({ params }) {
  const { slug } = await params;
  const session = await getSession();

  await connectDB();
  const subject = await Subject.findOne({ slug }).lean();
  if (!subject) notFound();

  const resources = await Resource.find({ subject: slug }).sort({ createdAt: -1 }).lean();
  const grouped = {
    notes: resources.filter((r) => r.type === "notes").map(serialize),
    dpp: resources.filter((r) => r.type === "dpp").map(serialize),
    lecture: resources.filter((r) => r.type === "lecture").map(serialize),
  };

  return (
    <StudentLayout name={session.name} active="subjects">
      <BackLink href="/subjects" label="Subjects" />
      <h1>{subject.name}</h1>
      <ResourceTabs resources={grouped} />
    </StudentLayout>
  );
}
