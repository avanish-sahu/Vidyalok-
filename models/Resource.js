import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true }, // subject slug
    type: { type: String, enum: ["notes", "dpp", "lecture", "testseries"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedByName: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);
