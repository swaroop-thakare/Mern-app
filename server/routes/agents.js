const express = require("express")
const Agent = require("../models/Agent")
const Contact = require("../models/Contact")
const { authMiddleware, adminMiddleware } = require("../middleware/auth")
const { redistributeContacts } = require("../utils/distribution")

const router = express.Router()

/**
 * @route   GET /api/agents
 * @desc    Get all agents
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const agents = await Agent.find().select("-password")

    // Get contact counts for each agent
    const agentsWithCounts = await Promise.all(
      agents.map(async (agent) => {
        const contactCount = await Contact.countDocuments({ assignedTo: agent._id })
        return {
          ...agent.toObject(),
          contactCount,
        }
      }),
    )

    res.json(agentsWithCounts)
  } catch (error) {
    console.error("Error fetching agents:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   POST /api/agents
 * @desc    Create a new agent
 * @access  Private/Admin
 */
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body

    // Validate input
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ email })
    if (existingAgent) {
      return res.status(400).json({ message: "Agent with this email already exists" })
    }

    // Create new agent
    const agent = new Agent({
      name,
      email,
      mobile,
      password,
    })

    await agent.save()

    res.status(201).json({
      message: "Agent created successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile,
      },
    })
  } catch (error) {
    console.error("Error creating agent:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   GET /api/agents/:id
 * @desc    Get agent by ID
 * @access  Private
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select("-password")

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    // Get contact count for this agent
    const contactCount = await Contact.countDocuments({ assignedTo: agent._id })

    res.json({
      ...agent.toObject(),
      contactCount,
    })
  } catch (error) {
    console.error("Error fetching agent:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   PUT /api/agents/:id
 * @desc    Update agent
 * @access  Private/Admin
 */
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, mobile, status } = req.body

    // Find agent
    const agent = await Agent.findById(req.params.id)
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    // Update fields
    if (name) agent.name = name
    if (email && email !== agent.email) {
      // Check if email is already in use
      const existingAgent = await Agent.findOne({ email, _id: { $ne: agent._id } })
      if (existingAgent) {
        return res.status(400).json({ message: "Email already in use" })
      }
      agent.email = email
    }
    if (mobile) agent.mobile = mobile
    if (status) agent.status = status

    await agent.save()

    // If agent status changed to inactive, redistribute contacts
    if (status === "inactive" && agent.status !== status) {
      await redistributeContacts(agent._id)
    }

    res.json({
      message: "Agent updated successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile,
        status: agent.status,
      },
    })
  } catch (error) {
    console.error("Error updating agent:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   DELETE /api/agents/:id
 * @desc    Delete agent
 * @access  Private/Admin
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    // Delete agent
    await Agent.findByIdAndDelete(req.params.id)

    // Reassign contacts
    await redistributeContacts(req.params.id)

    res.json({ message: "Agent deleted successfully" })
  } catch (error) {
    console.error("Error deleting agent:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   POST /api/agents/:id/reset-password
 * @desc    Reset agent password
 * @access  Private/Admin
 */
router.post("/:id/reset-password", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" })
    }

    const agent = await Agent.findById(req.params.id)
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    agent.password = newPassword
    await agent.save()

    res.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Error resetting password:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
