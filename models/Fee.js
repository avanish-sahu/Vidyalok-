import mongoose from "mongoose";

const FeeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    amount: { type: Number, default: 0 },
    paymentDate: { type: Date, default: null }, // when the payment was taken
    validUntil: { type: Date, default: null }, // subscription/access covers up to this date
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
