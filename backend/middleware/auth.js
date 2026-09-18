// middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header." });
    }

    try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role, username }
    next();
    } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
    }
}


function authorize(...allowedRoles) {
    return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
    };
}

module.exports = { authenticate, authorize };
