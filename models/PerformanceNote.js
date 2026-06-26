import mongoose from "mongoose";

const PerformanceNoteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    note: { type: String, default: "", trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

PerformanceNoteSchema.index({ student: 1, subject: 1 }, { unique: true });

export default mongoose.models.PerformanceNote || mongoose.model("PerformanceNote", PerformanceNoteSchema);
