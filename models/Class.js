import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Class || mongoose.model("Class", ClassSchema);
