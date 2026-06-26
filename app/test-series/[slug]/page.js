import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Resource from "@/models/Resource";
import StudentLayout from "@/app/components/StudentLayout";
import BackLink from "@/app/components/BackLink";
import ResourceList from "@/app/components/ResourceList";

export default async function TestSeriesDetailPage({ params }) {
  const { slug } = await params;
  const session = await getSession();

  await connectDB();
  const subject = await Subject.findOne({ slug }).lean();
  if (!subject) notFound();

  const resources = await Resource.find({ subject: slug, type: "testseries" })
    .sort({ createdAt: -1 })
    .lean();
  const list = resources.map((r) => ({
    id: r._id.toString(),
    title: r.title,
    description: r.description,
    fileUrl: r.fileUrl,
    originalName: r.originalName,
    uploadedByName: r.uploadedByName,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <StudentLayout name={session.name} active="test-series">
      <BackLink href="/test-series" label="Test Series" />
      <h1>{subject.name} — Test Series</h1>
      <ResourceList resources={list} emptyLabel="No test papers uploaded yet." />
    </StudentLayout>
  );
}
