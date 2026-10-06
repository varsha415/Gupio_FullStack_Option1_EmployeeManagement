import { Router } from "express";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";

const router = Router();
const fields = ["name", "email", "department", "designation"];

function validateEmployee(body) {
  const errors = {};
  const employee = {};

  for (const field of fields) {
    const value = body?.[field];
    if (typeof value !== "string" || !value.trim()) {
      errors[field] = `${field[0].toUpperCase()}${field.slice(1)} is required.`;
    } else {
      employee[field] = value.trim();
    }
  }

  if (employee.name && employee.name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (employee.name && employee.name.length > 80) errors.name = "Name must be 80 characters or fewer.";
  if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (employee.email && employee.email.length > 254) errors.email = "Email must be 254 characters or fewer.";
  if (employee.department && employee.department.length > 60) errors.department = "Department must be 60 characters or fewer.";
  if (employee.designation && employee.designation.length > 80) errors.designation = "Designation must be 80 characters or fewer.";

  const salary = body?.salary;
  if (salary !== undefined && salary !== null && salary !== "") {
    const parsedSalary = Number(salary);
    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      errors.salary = "Salary must be a non-negative number.";
    } else {
      employee.salary = parsedSalary;
    }
  } else if (salary === null || salary === "") {
    employee.salary = null;
  }

  const startDate = body?.startDate;
  if (startDate !== undefined && startDate !== null && startDate !== "") {
    const parsedDate = new Date(startDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.startDate = "Enter a valid start date.";
    } else {
      employee.startDate = parsedDate;
    }
  } else if (startDate === null || startDate === "") {
    employee.startDate = null;
  }

  const office = body?.office;
  if (office !== undefined && office !== null && typeof office !== "string") {
    errors.office = "Office must be text.";
  } else if (typeof office === "string") {
    if (office.trim().length > 100) errors.office = "Office must be 100 characters or fewer.";
    else employee.office = office.trim();
  } else if (office === null) {
    employee.office = null;
  }

  return { employee, errors };
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

router.get("/", async (req, res, next) => {
  try {
    const { search = "", department = "" } = req.query;
    const filter = {};
    if (typeof search === "string" && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }];
    }
    if (typeof department === "string" && department.trim() && department !== "all") {
      filter.department = department.trim();
    }

    const employees = await Employee.find(filter).sort({ name: 1 }).lean();
    res.json({ employees });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid employee ID", message: "The employee ID is not valid." });
    }
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ error: "Employee not found", message: "This employee may have been removed." });
    res.json({ employee });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { employee, errors } = validateEmployee(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Validation failed", message: "Please correct the highlighted fields.", fields: errors });
  }

  try {
    const created = await Employee.create(employee);
    res.status(201).json({ employee: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already in use", message: "An employee with this email already exists.", fields: { email: "This email is already in use." } });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: "Validation failed", message: "Please correct the submitted fields.", fields: Object.fromEntries(Object.entries(err.errors).map(([key, value]) => [key, value.message])) });
    }
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Invalid employee ID", message: "The employee ID is not valid." });
  }
  const { employee, errors } = validateEmployee(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Validation failed", message: "Please correct the highlighted fields.", fields: errors });
  }

  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, employee, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Employee not found", message: "This employee may have been removed." });
    res.json({ employee: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already in use", message: "An employee with this email already exists.", fields: { email: "This email is already in use." } });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: "Validation failed", message: "Please correct the submitted fields.", fields: Object.fromEntries(Object.entries(err.errors).map(([key, value]) => [key, value.message])) });
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid employee ID", message: "The employee ID is not valid." });
    }
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Employee not found", message: "This employee may have already been removed." });
    res.json({ message: "Employee deleted successfully." });
  } catch (err) {
    next(err);
  }
});

export default router;