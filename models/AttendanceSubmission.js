import mongoose from "mongoose";

const AttendanceSubmissionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    date: { type: Date, required: true },
    pdfUrl: { type: String, required: true },
    presentCount: { type: Number, required: true },
    totalCount: { type: Number, required: true },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

AttendanceSubmissionSchema.index({ teacher: 1, subject: 1, class: 1, date: 1 }, { unique: true });

export default mongoose.models.AttendanceSubmission ||
  mongoose.model("AttendanceSubmission", AttendanceSubmissionSchema);
