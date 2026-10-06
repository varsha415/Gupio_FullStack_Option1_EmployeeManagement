import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const emptyEmployee = { name: "", email: "", department: "", designation: "", salary: "", startDate: "", office: "" };
const departments = ["Engineering", "Design", "Marketing", "Sales", "HR", "People", "Finance", "Operations", "Product"];

export default function EmployeeForm({ employee, onClose, onSave }) {
  const [values, setValues] = useState(emptyEmployee);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(employee ? {
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      salary: employee.salary ?? "",
      startDate: employee.startDate ? new Date(employee.startDate).toISOString().slice(0, 10) : "",
      office: employee.office ?? "",
    } : emptyEmployee);
    setErrors({});
  }, [employee]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    const validation = {};
    if (values.name.trim().length < 2) validation.name = "Enter at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) validation.email = "Enter a valid email address.";
    if (!values.department) validation.department = "Choose a department.";
    if (!values.designation.trim()) validation.designation = "Enter a job title.";
    if (values.salary !== "" && (!Number.isFinite(Number(values.salary)) || Number(values.salary) < 0)) {
      validation.salary = "Enter a non-negative salary.";
    }
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await onSave({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        department: values.department,
        designation: values.designation.trim(),
        salary: values.salary === "" ? null : Number(values.salary),
        startDate: values.startDate || null,
        office: values.office.trim(),
      });
    } catch (error) {
      setErrors({ ...error.fields, form: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog form-dialog" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="dialog-head">
          <div>
            <span className="eyebrow">{employee ? "TEAM DIRECTORY" : "GROW YOUR TEAM"}</span>
            <h2 id="form-title">{employee ? "Edit employee" : "Add a teammate"}</h2>
            <p>{employee ? "Update their details below." : "Add someone new to your people directory."}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <label className="field full">
              <span>Full name</span>
              <input autoFocus value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Alex Morgan" maxLength={80} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
            <label className="field full">
              <span>Work email</span>
              <input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="alex@company.com" maxLength={254} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>
            <label className="field">
              <span>Department</span>
              <select value={values.department} onChange={(event) => update("department", event.target.value)}>
                <option value="">Select department</option>
                {departments.map((department) => <option key={department}>{department}</option>)}
              </select>
              {errors.department && <small className="field-error">{errors.department}</small>}
            </label>
            <label className="field">
              <span>Job title</span>
              <input value={values.designation} onChange={(event) => update("designation", event.target.value)} placeholder="e.g. Product Designer" maxLength={80} />
              {errors.designation && <small className="field-error">{errors.designation}</small>}
            </label>
            <label className="field">
              <span>Annual salary <small className="optional-label">Optional</small></span>
              <input type="number" min="0" step="1" value={values.salary} onChange={(event) => update("salary", event.target.value)} placeholder="e.g. 95000" />
              {errors.salary && <small className="field-error">{errors.salary}</small>}
            </label>
            <label className="field">
              <span>Start date <small className="optional-label">Optional</small></span>
              <input type="date" value={values.startDate} onChange={(event) => update("startDate", event.target.value)} />
              {errors.startDate && <small className="field-error">{errors.startDate}</small>}
            </label>
            <label className="field full">
              <span>Office location <small className="optional-label">Optional</small></span>
              <input value={values.office} onChange={(event) => update("office", event.target.value)} placeholder="e.g. New York" maxLength={100} />
              {errors.office && <small className="field-error">{errors.office}</small>}
            </label>
          </div>
          {errors.form && <div className="form-error" role="alert">{errors.form}</div>}
          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving…" : employee ? "Save changes" : "Add employee"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}