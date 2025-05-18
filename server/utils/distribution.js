const Contact = require("../models/Contact")
const Agent = require("../models/Agent")

/**
 * Distribute contacts evenly among active agents
 * @returns {Promise<void>}
 */
async function distributeContacts() {
  try {
    // Get all active agents
    const agents = await Agent.find({ status: "active" })
    if (agents.length === 0) {
      console.log("No active agents found for distribution")
      return
    }

    // Get all contacts
    const contacts = await Contact.find()
    if (contacts.length === 0) {
      console.log("No contacts found for distribution")
      return
    }

    // Reset assignments
    await Contact.updateMany({}, { assignedTo: null })

    // Calculate distribution
    const contactsPerAgent = Math.floor(contacts.length / agents.length)
    const remainder = contacts.length % agents.length

    let currentIndex = 0

    // Distribute contacts evenly
    for (let i = 0; i < agents.length; i++) {
      const agentContacts = contacts.slice(currentIndex, currentIndex + contactsPerAgent + (i < remainder ? 1 : 0))

      // Update contacts with agent assignment
      const updatePromises = agentContacts.map((contact) =>
        Contact.findByIdAndUpdate(contact._id, { assignedTo: agents[i]._id }),
      )

      await Promise.all(updatePromises)

      // Update agent's contact count
      await Agent.findByIdAndUpdate(agents[i]._id, { contactCount: agentContacts.length })

      currentIndex += agentContacts.length
    }

    console.log(`✅ Distributed ${contacts.length} contacts among ${agents.length} agents`)
  } catch (error) {
    console.error("Error distributing contacts:", error)
    throw error
  }
}

/**
 * Redistribute contacts after an agent is removed
 * @param {string} excludedAgentId - ID of the agent to exclude from distribution
 * @returns {Promise<void>}
 */
async function redistributeContacts(excludedAgentId = null) {
  try {
    // Get all active agents (excluding the deleted one if provided)
    const query = excludedAgentId ? { _id: { $ne: excludedAgentId }, status: "active" } : { status: "active" }

    const agents = await Agent.find(query)

    if (agents.length === 0) {
      // If no agents left, just unassign all contacts
      await Contact.updateMany({}, { assignedTo: null })
      console.log("No active agents found. All contacts unassigned.")
      return
    }

    // Get all contacts
    const contacts = await Contact.find()
    if (contacts.length === 0) {
      console.log("No contacts found for redistribution")
      return
    }

    // Reset assignments
    await Contact.updateMany({}, { assignedTo: null })

    // Calculate distribution
    const contactsPerAgent = Math.floor(contacts.length / agents.length)
    const remainder = contacts.length % agents.length

    let currentIndex = 0

    // Distribute contacts evenly
    for (let i = 0; i < agents.length; i++) {
      const agentContacts = contacts.slice(currentIndex, currentIndex + contactsPerAgent + (i < remainder ? 1 : 0))

      // Update contacts with agent assignment
      const updatePromises = agentContacts.map((contact) =>
        Contact.findByIdAndUpdate(contact._id, { assignedTo: agents[i]._id }),
      )

      await Promise.all(updatePromises)

      // Update agent's contact count
      await Agent.findByIdAndUpdate(agents[i]._id, { contactCount: agentContacts.length })

      currentIndex += agentContacts.length
    }

    console.log(`✅ Redistributed ${contacts.length} contacts among ${agents.length} agents`)
  } catch (error) {
    console.error("Error redistributing contacts:", error)
    throw error
  }
}

module.exports = {
  distributeContacts,
  redistributeContacts,
}
