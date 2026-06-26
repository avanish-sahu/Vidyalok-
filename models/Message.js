import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, required: true },
    audience: { type: String, enum: ["all", "subject"], required: true },
    subject: { type: String, default: null }, // subject slug, only when audience === "subject"
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
