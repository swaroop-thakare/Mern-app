const express = require("express")
const Agent = require("../models/Agent")
const Contact = require("../models/Contact")
const UploadHistory = require("../models/UploadHistory")
const { authMiddleware } = require("../middleware/auth")

const router = express.Router()

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    // Get agent stats
    const agentCount = await Agent.countDocuments()
    const activeAgentCount = await Agent.countDocuments({ status: "active" })

    // Get contact stats
    const contactCount = await Contact.countDocuments()
    const contactStatusCounts = await Contact.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

    // Format contact status counts
    const statusCounts = {}
    contactStatusCounts.forEach((item) => {
      statusCounts[item._id] = item.count
    })

    // Get distribution stats
    const agents = await Agent.find({ status: "active" }).select("_id name")
    const distributionStats = await Promise.all(
      agents.map(async (agent) => {
        const count = await Contact.countDocuments({ assignedTo: agent._id })
        return {
          agentId: agent._id,
          agentName: agent.name,
          count,
        }
      }),
    )

    // Get recent uploads
    const recentUploads = await UploadHistory.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("uploadedBy", "name email")

    res.json({
      agents: {
        total: agentCount,
        active: activeAgentCount,
        inactive: agentCount - activeAgentCount,
      },
      contacts: {
        total: contactCount,
        byStatus: statusCounts,
      },
      distribution: distributionStats,
      recentUploads,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
