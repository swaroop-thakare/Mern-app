const express = require("express")
const Contact = require("../models/Contact")
const Agent = require("../models/Agent")
const { authMiddleware, adminMiddleware } = require("../middleware/auth")

const router = express.Router()

/**
 * @route   GET /api/contacts
 * @desc    Get contacts with pagination and filtering
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, agentId, status } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ]
    }

    if (agentId) {
      query.assignedTo = agentId
    }

    if (status) {
      query.status = status
    }

    const contacts = await Contact.find(query)
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })

    const total = await Contact.countDocuments(query)

    res.json({
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate("assignedTo", "name email mobile")

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" })
    }

    res.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { firstName, phone, notes, status, assignedTo } = req.body

    const contact = await Contact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" })
    }

    // Update fields
    if (firstName) contact.firstName = firstName
    if (phone) contact.phone = phone
    if (notes !== undefined) contact.notes = notes
    if (status) {
      contact.status = status
      if (status === "contacted") {
        contact.lastContacted = new Date()
      }
    }

    // If assignedTo is changing, verify agent exists and update counts
    if (assignedTo && (!contact.assignedTo || assignedTo !== contact.assignedTo.toString())) {
      // Verify agent exists
      const agent = await Agent.findById(assignedTo)
      if (!agent) {
        return res.status(400).json({ message: "Invalid agent ID" })
      }

      // Update agent contact counts
      if (contact.assignedTo) {
        // Decrement previous agent's count
        const prevAgent = await Agent.findById(contact.assignedTo)
        if (prevAgent) {
          prevAgent.contactCount = Math.max(0, (prevAgent.contactCount || 0) - 1)
          await prevAgent.save()
        }
      }

      // Increment new agent's count
      agent.contactCount = (agent.contactCount || 0) + 1
      await agent.save()

      contact.assignedTo = assignedTo
    }

    await contact.save()

    // Return updated contact with populated agent
    const updatedContact = await Contact.findById(contact._id).populate("assignedTo", "name email mobile")

    res.json({
      message: "Contact updated successfully",
      contact: updatedContact,
    })
  } catch (error) {
    console.error("Error updating contact:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact
 * @access  Private/Admin
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" })
    }

    // Update agent contact count if assigned
    if (contact.assignedTo) {
      const agent = await Agent.findById(contact.assignedTo)
      if (agent) {
        agent.contactCount = Math.max(0, (agent.contactCount || 0) - 1)
        await agent.save()
      }
    }

    await Contact.findByIdAndDelete(req.params.id)

    res.json({ message: "Contact deleted successfully" })
  } catch (error) {
    console.error("Error deleting contact:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   POST /api/contacts/bulk-update
 * @desc    Update multiple contacts
 * @access  Private/Admin
 */
router.post("/bulk-update", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { contactIds, updates } = req.body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ message: "Contact IDs are required" })
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Updates are required" })
    }

    // Only allow certain fields to be updated in bulk
    const allowedUpdates = {}
    if (updates.status) allowedUpdates.status = updates.status
    if (updates.assignedTo) allowedUpdates.assignedTo = updates.assignedTo

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ message: "No valid updates provided" })
    }

    // If updating assignedTo, verify agent exists
    if (allowedUpdates.assignedTo) {
      const agent = await Agent.findById(allowedUpdates.assignedTo)
      if (!agent) {
        return res.status(400).json({ message: "Invalid agent ID" })
      }
    }

    // Update contacts
    const result = await Contact.updateMany({ _id: { $in: contactIds } }, { $set: allowedUpdates })

    // If assignedTo was updated, update agent contact counts
    if (allowedUpdates.assignedTo) {
      // Get all affected agents
      const contacts = await Contact.find({ _id: { $in: contactIds } })
      const affectedAgentIds = [
        ...new Set(contacts.map((c) => (c.assignedTo ? c.assignedTo.toString() : null)).filter((id) => id !== null)),
      ]

      // Add the new agent ID
      if (!affectedAgentIds.includes(allowedUpdates.assignedTo)) {
        affectedAgentIds.push(allowedUpdates.assignedTo)
      }

      // Update all affected agents' contact counts
      for (const agentId of affectedAgentIds) {
        const count = await Contact.countDocuments({ assignedTo: agentId })
        await Agent.findByIdAndUpdate(agentId, { contactCount: count })
      }
    }

    res.json({
      message: "Contacts updated successfully",
      count: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error updating contacts in bulk:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
