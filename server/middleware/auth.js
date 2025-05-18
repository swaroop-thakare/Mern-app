const jwt = require("jsonwebtoken")

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.isAdmin = decoded.isAdmin
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(401).json({ message: "Invalid token" })
  }
}

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

module.exports = {
  authMiddleware,
  adminMiddleware,
}
