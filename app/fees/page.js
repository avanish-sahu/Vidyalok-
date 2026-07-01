import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getFee } from "@/lib/performance";
import StudentLayout from "@/app/components/StudentLayout";

export default async function FeesPage() {
  const session = await getSession();

  await connectDB();
  const fee = await getFee(session.id);
  const isActive = fee?.validUntil && new Date(fee.validUntil) >= new Date();
  
  const totalFee = fee?.totalFee || 0;
  const amountPaid = fee?.amount || 0;
  const remainingFee = Math.max(0, totalFee - amountPaid);
  const installments = fee?.installments || [];

  return (
    <StudentLayout name={session.name} active="fees">
      <h1>Fees Details</h1>
      
      {!fee || (!fee.paymentDate && totalFee === 0) ? (
        <div className="empty-state">No fee details have been added yet.</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "20px 0" }}>
            <div className="card-block" style={{ flex: "1 1 200px", padding: "16px", margin: 0 }}>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Course Fee</span>
              <h2 style={{ margin: "4px 0 0 0", color: "var(--primary-dark)" }}>₹{totalFee}</h2>
            </div>
            <div className="card-block" style={{ flex: "1 1 200px", padding: "16px", margin: 0 }}>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Paid</span>
              <h2 style={{ margin: "4px 0 0 0", color: "var(--success)" }}>₹{amountPaid}</h2>
            </div>
            <div className="card-block" style={{ flex: "1 1 200px", padding: "16px", margin: 0 }}>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>Remaining Balance</span>
              <h2 style={{ margin: "4px 0 0 0", color: remainingFee > 0 ? "var(--danger)" : "var(--muted)" }}>₹{remainingFee}</h2>
            </div>
          </div>

          <div className="card-block" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4>Subscription & Access Status</h4>
              <span className={`badge ${isActive ? "badge-success" : "badge-danger"}`}>
                {isActive ? "Active" : "Expired"}
              </span>
            </div>
            {fee.validUntil && (
              <p style={{ fontSize: "14px", marginTop: "8px", color: "var(--muted)" }}>
                Your access covers classes up to <strong>{new Date(fee.validUntil).toLocaleDateString()}</strong>.
              </p>
            )}
          </div>

          {installments.length > 0 && (
            <div className="card-block">
              <h3>Payment Installments History</h3>
              <div className="resource-list" style={{ marginTop: 12 }}>
                {installments.slice().reverse().map((inst, i) => (
                  <div className="resource-item" key={inst._id || i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <h4 style={{ color: "var(--success)" }}>+ ₹{inst.amountPaid}</h4>
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                        Received: {new Date(inst.paymentDate).toLocaleDateString()} {inst.remark ? `· ${inst.remark}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
}
