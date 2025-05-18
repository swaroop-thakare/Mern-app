const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const morgan = require("morgan")
const portfinder = require("portfinder")

// Load environment variables
const envPath = path.resolve(__dirname, ".env")
console.log(`Looking for .env file at: ${envPath}`)

if (fs.existsSync(envPath)) {
  console.log("Found .env file, loading environment variables...")
  dotenv.config({ path: envPath })
} else {
  console.log(".env file not found, checking parent directory...")
  const parentEnvPath = path.resolve(__dirname, "../.env")

  if (fs.existsSync(parentEnvPath)) {
    console.log("Found .env file in parent directory, loading environment variables...")
    dotenv.config({ path: parentEnvPath })
  } else {
    console.log("No .env file found, using environment variables from Vercel...")
  }
}

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"]
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`)
  console.error("Please create a .env file with these variables or set them in your environment.")
  process.exit(1)
}

// Use environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mern_app"
const JWT_SECRET = process.env.JWT_SECRET || "yourSuperSecretKeyHere123"
const BASE_PORT = process.env.PORT || 5001 // Default to 5001 if not specified

console.log("MongoDB URI:", MONGODB_URI)
console.log("Base Port:", BASE_PORT)

// Initialize Express app
const app = express()

// Configure CORS with more permissive options for development
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-production-domain.com"
        : ["http://localhost:3000", "http://localhost:3001", "*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.use(express.json())
app.use(morgan("dev")) // Logging middleware

// Import and use routes
const authRoutes = require("./routes/auth")
app.use("/api/auth", authRoutes)

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Add connection event listeners
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected")
})

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err)
})

// Define User schema and model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: true },
  name: { type: String, default: "Admin" },
})

// Create User model only if it doesn't exist
const User = mongoose.models.User || mongoose.model("User", userSchema)

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.isAdmin = decoded.isAdmin
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(401).json({ message: "Invalid token" })
  }
}

// Routes

// Test route to verify server is running
app.get("/", (req, res) => {
  res.send("MERN Agent Management API is running!")
})

// Server info endpoint - returns the current port
let server // Declare server variable
app.get("/api/server-info", (req, res) => {
  res.json({
    port: server.address().port,
    timestamp: new Date().toISOString(),
  })
})

// Test route for frontend connectivity check
app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit")
  res.json({ message: "API is working!", timestamp: new Date().toISOString() })
})

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body
    console.log("Login attempt:", { email })

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      console.log("User not found:", email)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      console.log("Password mismatch for user:", email)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "1d" })

    console.log("Login successful for:", email)
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/auth/verify", authMiddleware, (req, res) => {
  res.status(200).json({ valid: true, isAdmin: req.isAdmin })
})

// Create admin user if none exists
async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ isAdmin: true })

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      const admin = new User({
        email: "admin@example.com",
        password: hashedPassword,
        name: "Admin User",
        isAdmin: true,
      })

      await admin.save()
      console.log("✅ Admin user created: admin@example.com / admin123")
    } else {
      console.log("✅ Admin user already exists")
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
  }
}

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err)
  // Keep the process alive but log the error
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  // Keep the process alive but log the error
})

// Configure portfinder
portfinder.basePort = Number.parseInt(BASE_PORT, 10)

// Start server with dynamic port
portfinder.getPort((err, port) => {
  if (err) {
    console.error("Error finding available port:", err)
    process.exit(1)
  }

  // Write the port to a file so the frontend can read it
  const portFilePath = path.resolve(__dirname, "../port.txt")
  fs.writeFileSync(portFilePath, port.toString())
  console.log(`✅ Port ${port} saved to ${portFilePath}`)

  server = app.listen(port, () => {
    // Assign server variable
    console.log(`✅ Server running on port ${port}`)
    console.log(`✅ API available at http://localhost:${port}/api`)
    createAdminUser()
  })
})
