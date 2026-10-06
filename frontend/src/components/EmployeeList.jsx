import React from "react";
import { ArrowUpRight, BriefcaseBusiness, Mail } from "lucide-react";

const colors = ["lavender", "peach", "mint", "blue", "rose", "gold"];

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function EmployeeList({ employees, onSelect, onEdit, onDelete }) {
  if (!employees.length) {
    return (
      <div className="empty-state">
        <div className="empty-illustration"><BriefcaseBusiness size={29} /></div>
        <h3>No teammates found</h3>
        <p>Try another search, or add someone to your directory.</p>
      </div>
    );
  }

  return (
    <div className="employee-grid">
      {employees.map((employee, index) => (
        <article className="employee-card" key={employee._id} onClick={() => onSelect(employee)}>
          <button className="card-open" aria-label={`View ${employee.name}`}><ArrowUpRight size={17} /></button>
          <div className="employee-card-top">
            <div className={`avatar avatar-${colors[index % colors.length]}`}>{initials(employee.name)}</div>
            <span className="employee-status"><span /> Active</span>
          </div>
          <h3>{employee.name}</h3>
          <p className="employee-title">{employee.designation}</p>
          <div className="employee-meta">
            <span><Mail size={14} />{employee.email}</span>
            <span><BriefcaseBusiness size={14} />{employee.department}</span>
          </div>
          <div className="card-actions" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => onEdit(employee)}>Edit profile</button>
            <button type="button" className="delete-link" onClick={() => onDelete(employee)}>Remove</button>
          </div>
        </article>
      ))}
    </div>
  );
}