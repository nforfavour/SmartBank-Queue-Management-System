const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user ||!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };