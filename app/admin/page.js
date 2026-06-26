import { getSession } from "@/lib/auth";
import Topbar from "@/app/components/Topbar";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <>
      <Topbar name={session.name} roleLabel="Admin" homeHref="/admin" />
      <div className="page">
        <h1>Teacher Approvals</h1>
        <AdminDashboard />
      </div>
    </>
  );
}
