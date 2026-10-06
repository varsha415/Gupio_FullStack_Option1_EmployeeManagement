const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Unable to reach the employee API at ${API_URL}. Check that the backend is running and VITE_API_URL is correct.`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `Request failed (${response.status}).`);
    error.fields = payload.fields || {};
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const employeeApi = {
  list: () => request("/employees"),
  create: (employee) => request("/employees", { method: "POST", body: JSON.stringify(employee) }),
  update: (id, employee) => request(`/employees/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(employee) }),
  remove: (id) => request(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" }),
};