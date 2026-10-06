import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [80, "Name must be 80 characters or fewer."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email must be 254 characters or fewer."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
      unique: true,
    },
    department: {
      type: String,
      required: [true, "Department is required."],
      trim: true,
      maxlength: [60, "Department must be 60 characters or fewer."],
    },
    designation: {
      type: String,
      required: [true, "Designation is required."],
      trim: true,
      maxlength: [80, "Designation must be 80 characters or fewer."],
    },
    salary: {
      type: Number,
      min: [0, "Salary cannot be negative."],
    },
    startDate: {
      type: Date,
    },
    office: {
      type: String,
      trim: true,
      maxlength: [100, "Office must be 100 characters or fewer."],
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Employee", employeeSchema);