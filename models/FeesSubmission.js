import mongoose from "mongoose";

const FeesSubmissionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    totalRequired: { type: Number, required: true },
    totalPaid: { type: Number, required: true },
    totalPending: { type: Number, required: true },
    totalCount: { type: Number, required: true },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

FeesSubmissionSchema.index({ teacher: 1, class: 1 }, { unique: true });

export default mongoose.models.FeesSubmission ||
  mongoose.model("FeesSubmission", FeesSubmissionSchema);
