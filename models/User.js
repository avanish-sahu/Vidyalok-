import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null }, // null until a student sets it on first login
    role: { type: String, enum: ["student", "teacher"], required: true },
    subjects: [{ type: String }], // subject slugs the teacher teaches; unused for students
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.role === "teacher" ? "pending" : "approved";
      },
    },
    addedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // teachers who added this student
    class: { type: String, default: null }, // approved/active class slug; used for all content filtering
    pendingClass: { type: String, default: null }, // class the student picked, awaiting teacher approval
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
