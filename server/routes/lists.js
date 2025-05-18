const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Contact = require("../models/Contact")
const UploadHistory = require("../models/UploadHistory")
const Agent = require("../models/Agent") // Added import for Agent model
const { authMiddleware, adminMiddleware } = require("../middleware/auth")
const { processFile, validateContacts } = require("../utils/fileProcessing")
const { distributeContacts } = require("../utils/distribution")

const router = express.Router()

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    cb(null, uniqueSuffix + extension)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type. Only CSV, XLS, and XLSX are allowed."))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

/**
 * @route   POST /api/lists/upload
 * @desc    Upload and process contact list
 * @access  Private/Admin
 */
router.post("/upload", authMiddleware, adminMiddleware, upload.single("file"), async (req, res) => {
  let uploadRecord = null
  const startTime = Date.now()

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const filePath = req.file.path

    // Create upload history record
    uploadRecord = new UploadHistory({
      fileName: req.file.originalname,
      fileSize: req.file.size,
      recordCount: 0, // Will update after processing
      uploadedBy: req.userId,
      status: "success",
    })

    // Process file
    const records = await processFile(filePath)

    // Validate records
    if (records.length === 0) {
      uploadRecord.status = "failed"
      uploadRecord.errorMessage = "No valid records found in file"
      await uploadRecord.save()

      return res.status(400).json({ message: "No valid records found in file" })
    }

    // Validate contacts
    const { validContacts, errors } = validateContacts(records)

    if (validContacts.length === 0) {
      uploadRecord.status = "failed"
      uploadRecord.errorMessage = "No valid contacts found in file"
      await uploadRecord.save()

      return res.status(400).json({
        message: "No valid contacts found in file",
        errors,
      })
    }

    // Update record count
    uploadRecord.recordCount = validContacts.length

    // Clear existing contacts
    await Contact.deleteMany({})

    // Save contacts to database
    await Contact.insertMany(validContacts)

    // Distribute contacts among agents
    await distributeContacts()

    // Clean up uploaded file
    fs.unlinkSync(filePath)

    // Update processing time
    uploadRecord.processingTime = Date.now() - startTime
    await uploadRecord.save()

    res.json({
      message: "File uploaded and processed successfully",
      totalRecords: validContacts.length,
      uploadId: uploadRecord._id,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error processing file:", error)

    if (uploadRecord) {
      uploadRecord.status = "failed"
      uploadRecord.errorMessage = error.message
      uploadRecord.processingTime = Date.now() - startTime
      await uploadRecord.save()
    }

    res.status(500).json({ message: "Error processing file: " + error.message })
  }
})

/**
 * @route   GET /api/lists/distribution
 * @desc    Get contact distribution among agents
 * @access  Private
 */
router.get("/distribution", authMiddleware, async (req, res) => {
  try {
    const agents = await Agent.find({ status: "active" }).select("-password")

    const distribution = await Promise.all(
      agents.map(async (agent) => {
        const contacts = await Contact.find({ assignedTo: agent._id })
        return {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          contacts,
        }
      }),
    )

    res.json(distribution)
  } catch (error) {
    console.error("Error fetching distribution:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   POST /api/lists/redistribute
 * @desc    Redistribute contacts among agents
 * @access  Private/Admin
 */
router.post("/redistribute", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await distributeContacts()
    res.json({ message: "Lists redistributed successfully" })
  } catch (error) {
    console.error("Error redistributing lists:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   GET /api/lists/uploads
 * @desc    Get upload history
 * @access  Private
 */
router.get("/uploads", authMiddleware, async (req, res) => {
  try {
    const uploads = await UploadHistory.find().sort({ createdAt: -1 }).populate("uploadedBy", "name email")

    res.json(uploads)
  } catch (error) {
    console.error("Error fetching upload history:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
