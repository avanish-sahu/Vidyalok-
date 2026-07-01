import mongoose from "mongoose";

const InstallmentSchema = new mongoose.Schema({
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  remark: { type: String, default: "" },
});

const FeeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    amount: { type: Number, default: 0 }, // Total paid amount
    paymentDate: { type: Date, default: null }, // Date of the latest payment
    validUntil: { type: Date, default: null }, // Validity/access expiration
    totalFee: { type: Number, default: 0 }, // Total fees required (e.g. 20000)
    installments: [InstallmentSchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
