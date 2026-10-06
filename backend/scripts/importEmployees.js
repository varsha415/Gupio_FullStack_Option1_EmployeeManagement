import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import Employee from "../src/models/Employee.js";

const csvPath = fileURLToPath(new URL("../data/employees.csv", import.meta.url));

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = source.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The employee CSV contains an unterminated quoted field.");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toEmployee(headers, values, lineNumber) {
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  const required = ["name", "email", "department", "role", "salary", "start_date", "office"];
  const missing = required.filter((header) => !(header in record));
  if (missing.length) {
    throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
  }

  const salary = Number(record.salary);
  const dateMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(record.start_date);
  if (!record.name.trim() || !record.email.trim() || !record.department.trim() || !record.role.trim() || !record.office.trim()) {
    throw new Error(`CSV row ${lineNumber} is missing a required employee value.`);
  }
  if (!Number.isFinite(salary) || salary < 0) {
    throw new Error(`CSV row ${lineNumber} has an invalid salary.`);
  }
  if (!dateMatch) {
    throw new Error(`CSV row ${lineNumber} has an invalid start_date; expected DD-MM-YYYY.`);
  }

  const [, day, month, year] = dateMatch;
  const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    startDate.getUTCFullYear() !== Number(year) ||
    startDate.getUTCMonth() !== Number(month) - 1 ||
    startDate.getUTCDate() !== Number(day)
  ) {
    throw new Error(`CSV row ${lineNumber} has an invalid calendar date.`);
  }

  return {
    name: record.name.trim(),
    email: record.email.trim().toLowerCase(),
    department: record.department.trim(),
    designation: record.role.trim(),
    salary,
    startDate,
    office: record.office.trim(),
  };
}

async function importEmployees() {
  const csv = await readFile(csvPath, "utf8");
  const [headerRow, ...dataRows] = parseCsv(csv);
  if (!headerRow?.length) throw new Error("The employee CSV is empty.");

  const headers = headerRow.map((header) => header.trim().toLowerCase());
  const employees = dataRows.map((row, index) => toEmployee(headers, row, index + 2));
  const emails = new Set(employees.map((employee) => employee.email));
  if (emails.size !== employees.length) throw new Error("The employee CSV contains duplicate email addresses.");

  await connectDatabase();
  const result = await Employee.bulkWrite(
    employees.map((employee) => ({
      updateOne: {
        filter: { email: employee.email },
        update: { $set: employee },
        upsert: true,
      },
    })),
    { ordered: true }
  );

  console.info(
    `Employee CSV import complete: ${result.upsertedCount} added, ${result.modifiedCount} updated, ${employees.length} processed.`
  );
}

try {
  await importEmployees();
} catch (error) {
  console.error(`Employee CSV import failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
