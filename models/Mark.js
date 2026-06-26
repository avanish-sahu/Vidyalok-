import mongoose from "mongoose";

const MarkSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    testName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Mark || mongoose.model("Mark", MarkSchema);
