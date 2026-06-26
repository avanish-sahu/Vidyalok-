import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getFee } from "@/lib/performance";
import StudentLayout from "@/app/components/StudentLayout";

export default async function FeesPage() {
  const session = await getSession();

  await connectDB();
  const fee = await getFee(session.id);
  const isActive = fee?.validUntil && new Date(fee.validUntil) >= new Date();

  return (
    <StudentLayout name={session.name} active="fees">
      <h1>Fees</h1>
      {!fee || !fee.paymentDate ? (
        <div className="empty-state">No fee details have been added yet.</div>
      ) : (
        <div className="card-block">
          <div className="resource-item" style={{ border: "none", padding: 0 }}>
            <div>
              <h4>Amount Paid</h4>
              <p>₹{fee.amount}</p>
              <div className="resource-meta">
                Paid on {new Date(fee.paymentDate).toLocaleDateString()}
                {fee.validUntil && ` · Valid until ${new Date(fee.validUntil).toLocaleDateString()}`}
              </div>
            </div>
            <span className={`badge ${isActive ? "badge-success" : "badge-danger"}`}>
              {isActive ? "Active" : "Expired"}
            </span>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
