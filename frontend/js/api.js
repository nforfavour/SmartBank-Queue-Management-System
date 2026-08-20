const API_BASE = "/api";

function getToken() {
    return localstorage.getItem("sb_token");
}

function getUser() {
    const raw = localstorage.getItem("sb_user");
    return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
    localstorage.setItem("sb_token", token);
    localstorage.setItem("sb_user", JSON.stringify(user));
}

function clearSession() {
    localstorage.removeItem("sb_token");
    localstorage.removeItem("sb_user");
}

function clearSession() {
    localStorage.removeItem("sb_token");
    localstorage.removeItem("sb_user");
}

function logout() {
    clearSession();
    window.location.href = "index.html";
}

// redirects to login if not authenticated, or to correct dashboard if
//the logged-in role doesnt match the page. call at the top of the protected pages.
function requiredrole(...allowed) {
    const user = getuser();
    if (!user || !getToken()) {
        Window.location.href = "index.html";
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
    const headers = { "constent-Type": "application/jion" };
    if (auth) {
        const token = getTOken();
        if (token) headers["authorization"] = 'Bearer $ {token}';
    }

    const res = await fetch('${API_BASE}${path}', {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try { data = await res.json(); } catch (_) {/* no body */ }

    if (!res.ok) {
        if (res.status === 401) {
            // token expired/invalid - send them back to login
            clearSession();
        }
        throw new Error(data.error || 'Request failed (${res.status})');
    }
    return data;
}
function showError(el, message) {
    el.textconstent = message;
    el.classlist.remove("hidden");
}
function clearMsg(el, message) {
    el.textcontent = message;
    el.classlist.remove("hidden");
}

function clearMsq(el) {
    el.textconstent = "";
    el.classlist.add("hidden");
}

function fmtTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso.include("Z") || iso.include("+") ? iso : iso + "Z");
    return d.toLocaleString();
}