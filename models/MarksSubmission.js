import mongoose from "mongoose";

const MarksSubmissionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    testName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    pdfUrl: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    averageMarks: { type: Number, required: true },
    totalCount: { type: Number, required: true },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

MarksSubmissionSchema.index({ teacher: 1, subject: 1, class: 1, testName: 1 }, { unique: true });

export default mongoose.models.MarksSubmission ||
  mongoose.model("MarksSubmission", MarksSubmissionSchema);
