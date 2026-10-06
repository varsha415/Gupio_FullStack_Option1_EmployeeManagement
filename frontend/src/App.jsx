import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp, Bell, BriefcaseBusiness, Building2, Check, ChevronDown, ChevronRight, CircleHelp,
  LayoutDashboard, LoaderCircle, Pencil, Plus, RefreshCw, Search, Settings2, Trash2, Users, X,
} from "lucide-react";
import { employeeApi } from "./api/employees.js";
import EmployeeForm from "./components/EmployeeForm.jsx";
import EmployeeList from "./components/EmployeeList.jsx";

const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR"];

function EmployeeDetails({ employee, onClose, onEdit, onDelete, currency }) {
  const initials = employee.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-banner"><button className="icon-button detail-close" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        <div className="detail-content">
          <div className="avatar avatar-lavender detail-avatar">{initials}</div>
          <span className="eyebrow">EMPLOYEE PROFILE</span>
          <h2 id="detail-title">{employee.name}</h2>
          <p className="detail-designation">{employee.designation}</p>
          <div className="detail-facts">
            <div><span>EMAIL ADDRESS</span><strong>{employee.email}</strong></div>
            <div><span>DEPARTMENT</span><strong>{employee.department}</strong></div>
            {employee.office && <div><span>OFFICE</span><strong>{employee.office}</strong></div>}
            {employee.salary != null && <div><span>ANNUAL SALARY</span><strong>{new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(employee.salary)}</strong></div>}
            <div><span>START DATE</span><strong>{new Date(employee.startDate || employee.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</strong></div>
          </div>
          <div className="detail-actions">
            <button type="button" className="button button-danger detail-delete" onClick={() => onDelete(employee)}><Trash2 size={15} /> Delete employee</button>
            <button type="button" className="button button-primary detail-edit" onClick={() => onEdit(employee)}><Pencil size={15} /> Edit information</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [formEmployee, setFormEmployee] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activePage, setActivePage] = useState("people");
  const [openMenu, setOpenMenu] = useState("");
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = window.localStorage.getItem("peopledesk-currency");
    return supportedCurrencies.includes(savedCurrency) ? savedCurrency : "USD";
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await employeeApi.list();
      setEmployees(result.employees);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setFormOpen(false);
        setSelectedEmployee(null);
        setDeleteEmployee(null);
        setOpenMenu("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query || employee.name.toLowerCase().includes(query) || employee.email.toLowerCase().includes(query);
      const matchesDepartment = department === "all" || employee.department === department;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, department]);
  const departments = useMemo(() => [...new Set(employees.map((employee) => employee.department))].sort(), [employees]);

  async function saveEmployee(values) {
    if (formEmployee) {
      const { employee } = await employeeApi.update(formEmployee._id, values);
      setEmployees((current) => current.map((item) => item._id === employee._id ? employee : item));
      setNotice("Employee details updated.");
    } else {
      const { employee } = await employeeApi.create(values);
      setEmployees((current) => [...current, employee].sort((a, b) => a.name.localeCompare(b.name)));
      setNotice("New teammate added to your directory.");
    }
    setFormOpen(false);
    setSelectedEmployee(null);
  }

  async function removeEmployee() {
    setDeleting(true);
    try {
      await employeeApi.remove(deleteEmployee._id);
      setEmployees((current) => current.filter((item) => item._id !== deleteEmployee._id));
      setSelectedEmployee(null);
      setDeleteEmployee(null);
      setNotice("Employee removed from your directory.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setDeleting(false);
    }
  }

  function editEmployee(employee) {
    setSelectedEmployee(null);
    setFormEmployee(employee);
    setFormOpen(true);
  }

  function deleteEmployeeRecord(employee) {
    setSelectedEmployee(null);
    setDeleteEmployee(employee);
  }

  function openCreate() {
    setFormEmployee(null);
    setFormOpen(true);
  }

  const engineering = employees.filter((employee) => employee.department.toLowerCase() === "engineering").length;
  const teamCount = employees.length;
  const departmentCount = departments.length;
  const pageLabels = {
    overview: "Overview",
    people: "People",
    departments: "Departments",
    help: "Help & support",
    settings: "Settings",
  };

  function navigate(page) {
    setActivePage(page);
    setOpenMenu("");
    if (page !== "people") setDepartment("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveCurrency(value) {
    if (!supportedCurrencies.includes(value)) return;
    setCurrency(value);
    window.localStorage.setItem("peopledesk-currency", value);
  }

  function showDepartment(name) {
    setDepartment(name);
    setSearch("");
    setActivePage("people");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const recentEmployees = [...employees]
    .sort((first, second) => new Date(second.startDate || second.createdAt) - new Date(first.startDate || first.createdAt))
    .slice(0, 6);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button type="button" className="brand" onClick={() => navigate("overview")} aria-label="PeopleDesk overview"><span className="brand-mark"><Users size={20} strokeWidth={2.6} /></span><span>people<span className="brand-light">desk</span></span></button>
        <div className="sidebar-menu-wrap">
          <button type="button" className="workspace-switch" aria-expanded={openMenu === "workspace"} onClick={() => setOpenMenu(openMenu === "workspace" ? "" : "workspace")}><span className="workspace-icon">S</span><span><b>Studio North</b><small>Workspace</small></span><ChevronDown size={15} /></button>
          {openMenu === "workspace" && <div className="sidebar-popover workspace-popover"><span className="popover-label">CURRENT WORKSPACE</span><button type="button" className="popover-row selected"><span className="workspace-icon">S</span><span><b>Studio North</b><small>Workspace</small></span><Check size={15} /></button><button type="button" className="popover-action" onClick={() => navigate("settings")}>Workspace settings <ChevronRight size={15} /></button></div>}
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav className="side-nav" aria-label="Main navigation">
          <button type="button" className={`nav-item ${activePage === "overview" ? "active" : ""}`} onClick={() => navigate("overview")} aria-current={activePage === "overview" ? "page" : undefined}><LayoutDashboard size={18} />Overview</button>
          <button type="button" className={`nav-item ${activePage === "people" ? "active" : ""}`} onClick={() => navigate("people")} aria-current={activePage === "people" ? "page" : undefined}><Users size={18} />People <span className="nav-count">{teamCount}</span></button>
          <button type="button" className={`nav-item ${activePage === "departments" ? "active" : ""}`} onClick={() => navigate("departments")} aria-current={activePage === "departments" ? "page" : undefined}><Building2 size={18} />Departments</button>
        </nav>
        <div className="sidebar-bottom">
          <button type="button" className={`nav-item ${activePage === "help" ? "active" : ""}`} onClick={() => navigate("help")} aria-current={activePage === "help" ? "page" : undefined}><CircleHelp size={18} />Help & support</button>
          <button type="button" className={`nav-item ${activePage === "settings" ? "active" : ""}`} onClick={() => navigate("settings")} aria-current={activePage === "settings" ? "page" : undefined}><Settings2 size={18} />Settings</button>
          <div className="sidebar-menu-wrap">
            <button type="button" className="sidebar-user" aria-expanded={openMenu === "sidebar-profile"} onClick={() => setOpenMenu(openMenu === "sidebar-profile" ? "" : "sidebar-profile")}><div className="user-avatar">JD</div><span><b>Jordan Davis</b><small>Workspace admin</small></span><ChevronDown size={15} /></button>
            {openMenu === "sidebar-profile" && <div className="sidebar-popover profile-popover"><span className="popover-label">SIGNED IN AS</span><div className="profile-summary"><div className="user-avatar">JD</div><span><b>Jordan Davis</b><small>Workspace admin</small></span></div><button type="button" className="popover-action" onClick={() => navigate("settings")}>Open settings <ChevronRight size={15} /></button></div>}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <b>{pageLabels[activePage]}</b></div>
          <div className="topbar-actions"><span className="date-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}</span>
            <div className="top-menu-wrap"><button type="button" className="top-icon" aria-label="Notifications" aria-expanded={openMenu === "notifications"} onClick={() => setOpenMenu(openMenu === "notifications" ? "" : "notifications")}><Bell size={18} /><i /></button>{openMenu === "notifications" && <div className="top-popover notification-popover"><b>You're all caught up</b><p>There are no new notifications right now.</p><button type="button" className="popover-action" onClick={() => { setOpenMenu(""); refresh(); }}>Refresh team data <RefreshCw size={14} /></button></div>}</div>
            <div className="top-menu-wrap"><button type="button" className="top-avatar" aria-label="Open Jordan Davis menu" aria-expanded={openMenu === "top-profile"} onClick={() => setOpenMenu(openMenu === "top-profile" ? "" : "top-profile")}>JD</button>{openMenu === "top-profile" && <div className="top-popover profile-top-popover"><span className="popover-label">SIGNED IN AS</span><div className="profile-summary"><div className="user-avatar">JD</div><span><b>Jordan Davis</b><small>Workspace admin</small></span></div><button type="button" className="popover-action" onClick={() => navigate("settings")}>Open settings <ChevronRight size={15} /></button></div>}</div>
          </div>
        </header>
        <div className="page-wrap">
          <section className="welcome-row">
            <div><div className="eyebrow page-eyebrow">{activePage === "people" ? "YOUR PEOPLE, AT A GLANCE" : "STUDIO NORTH WORKSPACE"}</div><h1>{activePage === "people" || activePage === "overview" ? <>Good morning, Jordan <span className="wave">✦</span></> : pageLabels[activePage]}</h1><p>{activePage === "people" ? "Here's what's happening with your team today." : activePage === "overview" ? "A quick look at your people and teams." : activePage === "departments" ? "Explore your teams and the people in them." : activePage === "help" ? "Find your way around PeopleDesk." : "Manage your workspace preferences."}</p></div>
            {(activePage === "people" || activePage === "overview") && <button className="button button-primary add-button" onClick={openCreate}><Plus size={18} strokeWidth={2.5} /> Add teammate</button>}
          </section>

          {(activePage === "people" || activePage === "overview" || activePage === "departments") && <section className="stats-grid" aria-label="Team overview">
            <article className="stat-card stat-indigo"><div className="stat-top"><span>Total teammates</span><span className="stat-icon"><Users size={17} /></span></div><strong>{teamCount}</strong><small>People in your workspace</small><div className="stat-decoration">✳</div></article>
            <article className="stat-card stat-peach"><div className="stat-top"><span>Departments</span><span className="stat-icon"><Building2 size={17} /></span></div><strong>{departmentCount}</strong><small>Unique teams represented</small><div className="stat-decoration">✳</div></article>
            <article className="stat-card stat-green"><div className="stat-top"><span>Engineering</span><span className="stat-icon"><BriefcaseBusiness size={17} /></span></div><strong>{engineering}</strong><small>People building great things</small><div className="stat-decoration">✳</div></article>
          </section>}

          {activePage === "people" && <section className="directory-section" id="directory">
              <div className="directory-heading"><div><div className="heading-with-count"><h2>Team directory</h2><span className="count-pill">{filteredEmployees.length}</span></div><p>{department === "all" ? "Get to know the people behind the work." : `Showing ${department} teammates.`}</p></div><button className="button button-outline" onClick={openCreate}><Plus size={17} /> Add person</button></div>
              <div className="toolbar">
                <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email..." aria-label="Search by name or email" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}<kbd>⌘ K</kbd></label>
                <label className="filter-box"><ArrowDownUp size={15} /><span>Department</span><select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} className="select-chevron" /></label>
              </div>
              {loadError && <div className="error-banner" role="alert"><span><b>Couldn't load your team.</b> {loadError}</span><button className="button button-quiet" onClick={refresh}>Try again</button></div>}
              {loading ? <div className="loading-state"><LoaderCircle className="spinner" size={24} /><span>Loading your team…</span></div> : !loadError ? <EmployeeList employees={filteredEmployees} onSelect={setSelectedEmployee} onEdit={editEmployee} onDelete={setDeleteEmployee} /> : null}
            </section>}

          {activePage === "overview" && <section className="directory-section">
            <div className="directory-heading"><div><div className="heading-with-count"><h2>Recently joined</h2><span className="count-pill">{recentEmployees.length}</span></div><p>Meet some of your newest teammates.</p></div><button className="button button-outline" onClick={() => navigate("people")}>View all people <ChevronRight size={16} /></button></div>
            {loadError && <div className="error-banner" role="alert"><span><b>Couldn't load your team.</b> {loadError}</span><button className="button button-quiet" onClick={refresh}>Try again</button></div>}
            {loading ? <div className="loading-state"><LoaderCircle className="spinner" size={24} /><span>Loading your team…</span></div> : !loadError ? <EmployeeList employees={recentEmployees} onSelect={setSelectedEmployee} onEdit={editEmployee} onDelete={setDeleteEmployee} /> : null}
          </section>}

          {activePage === "departments" && <section className="directory-section">
            <div className="directory-heading"><div><div className="heading-with-count"><h2>Your departments</h2><span className="count-pill">{departmentCount}</span></div><p>Select a team to browse its members.</p></div></div>
            {loadError && <div className="error-banner" role="alert"><span><b>Couldn't load your departments.</b> {loadError}</span><button className="button button-quiet" onClick={refresh}>Try again</button></div>}
            {loading ? <div className="loading-state"><LoaderCircle className="spinner" size={24} /><span>Loading departments…</span></div> : <div className="department-grid">{departments.map((name) => { const members = employees.filter((employee) => employee.department === name); return <button type="button" className="department-card" key={name} onClick={() => showDepartment(name)}><span className="department-card-icon"><Building2 size={19} /></span><span className="department-card-copy"><b>{name}</b><small>{members.length} {members.length === 1 ? "teammate" : "teammates"}</small></span><ChevronRight size={17} className="department-chevron" /></button>; })}</div>}
          </section>}

          {activePage === "help" && <section className="directory-section info-page">
            <div className="directory-heading"><div><div className="heading-with-count"><h2>Getting started</h2></div><p>Quick answers to common questions.</p></div></div>
            <div className="help-grid">
              <article className="info-card"><span className="department-card-icon"><Search size={19} /></span><h3>Find a teammate</h3><p>Open People and use the search box to find anyone by name or email. Use the department filter to narrow the list.</p><button type="button" className="text-action" onClick={() => navigate("people")}>Go to people <ChevronRight size={15} /></button></article>
              <article className="info-card"><span className="department-card-icon"><Users size={19} /></span><h3>Manage employee records</h3><p>Choose a profile to view its details. Use Edit profile to update it, or Remove to delete the record.</p><button type="button" className="text-action" onClick={() => navigate("people")}>Open directory <ChevronRight size={15} /></button></article>
              <article className="info-card"><span className="department-card-icon"><Plus size={19} /></span><h3>Add someone new</h3><p>New teammates can be added from the people directory. Required fields are checked before saving.</p><button type="button" className="text-action" onClick={openCreate}>Add a teammate <ChevronRight size={15} /></button></article>
            </div>
          </section>}

          {activePage === "settings" && <section className="directory-section info-page">
            <div className="directory-heading"><div><div className="heading-with-count"><h2>Workspace preferences</h2></div><p>Update preferences for this browser and check your connection.</p></div></div>
            <div className="settings-card">
              <div className="settings-row"><span className="settings-symbol"><BriefcaseBusiness size={18} /></span><span className="settings-copy"><b>Workspace</b><small>Studio North · Employee directory</small></span><span className="settings-value">Current</span></div>
              <div className="settings-row"><span className="settings-symbol"><Building2 size={18} /></span><span className="settings-copy"><b>Salary display currency</b><small>Used for employee profile details in this browser.</small></span><select value={currency} onChange={(event) => saveCurrency(event.target.value)} aria-label="Salary display currency"><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option><option value="CAD">CAD — Canadian Dollar</option><option value="AUD">AUD — Australian Dollar</option><option value="INR">INR — Indian Rupee</option></select></div>
              <div className="settings-row"><span className="settings-symbol"><RefreshCw size={18} /></span><span className="settings-copy"><b>API connection</b><small>{loading ? "Checking employee API…" : loadError ? "Could not reach the employee API." : "Employee data is available."}</small></span><span className={`connection-pill ${!loading && !loadError ? "connected" : ""}`}><i />{loading ? "Checking" : loadError ? "Offline" : "Connected"}</span></div>
              <div className="settings-footer"><button type="button" className="button button-outline" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? "spinner" : ""} />{loading ? "Checking…" : "Check connection"}</button></div>
            </div>
          </section>}
          <footer className="page-footer"><span>Made for teams that care <span className="footer-heart">♥</span></span><span>PEOPLEDESK · TEAM DIRECTORY</span></footer>
        </div>
      </main>

      {formOpen && <EmployeeForm employee={formEmployee} onClose={() => setFormOpen(false)} onSave={saveEmployee} />}
      {selectedEmployee && <EmployeeDetails employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onEdit={editEmployee} onDelete={deleteEmployeeRecord} currency={currency} />}
      {deleteEmployee && <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setDeleteEmployee(null)}><section className="dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="confirm-icon"><Users size={21} /></div><h2 id="delete-title">Remove {deleteEmployee.name}?</h2><p>This will permanently remove their profile from your team directory.</p><div className="form-actions"><button className="button button-quiet" onClick={() => setDeleteEmployee(null)} disabled={deleting}>Keep employee</button><button className="button button-danger" onClick={removeEmployee} disabled={deleting}>{deleting ? "Removing…" : "Remove employee"}</button></div></section></div>}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

export default App;