// js/api.js
// Shared by every page: handles talking to the backend and remembering
// who is logged in.

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("sb_token");
}

function getUser() {
  const raw = localStorage.getItem("sb_user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("sb_token", token);
  localStorage.setItem("sb_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("sb_token");
  localStorage.removeItem("sb_user");
}

// Called by the "Log Out" button (onclick="logout()") on every dashboard page.
function logout() {
  clearSession();
  window.location.href = "index.html";
}

// Formats an ISO timestamp into a readable local date/time string.
// Used by customer.html (ticket history) and staff.html (waiting line).
function fmtTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

function roleHome(role) {
  if (role === "admin") return "admin.html";
  if (role === "staff") return "staff.html";
  return "customer.html";
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
  }
  const res = await fetch(API_BASE + path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new Error(data.error || "Request failed (" + res.status + ")");
  }
  return data;
}

function requireRole(allowed) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = "index.html";
    return null;
  }
  if (allowed.length && allowed.indexOf(user.role) === -1) {
    window.location.href = roleHome(user.role);
    return null;
  }
  return user;
}

function clearMsg(el) {
  el.textContent = "";
  el.classList.add("hidden");
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}
