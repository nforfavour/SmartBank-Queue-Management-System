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

function logout() {
    clearSession();
    window.location.href = "index.html";
}

// Redirects to login if not authenticated, or to correct dashboard if
// the logged-in role doesn't match the page. Call at the top of protected pages.
function requireRole(...allowed) {
    const user = getUser();
    const token = getToken();
    if (!user || !token) {
        window.location.href = "index.html";
        return null;
    }
    if (allowed.length && !allowed.includes(user.role)) {
        window.location.href = roleHome(user.role);
        return null;
    }
    return user;
}

function roleHome(role) {
    if (role === "staff") return "staff.html";
    if (role === "admin") return "admin.html";
    return "customer.html";
}

async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        /* no body */
    }

    if (!res.ok) {
        if (res.status === 401) {
            // Token expired/invalid - send back to login
            clearSession();
        }
        throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
}

function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
}

function clearMsg(el) {
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
}

function fmtTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso.includes("Z") || iso.includes("+") ? iso : iso + "Z");
    return d.toLocaleString();
}