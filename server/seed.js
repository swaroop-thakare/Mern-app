const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Define schemas
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: true },
    name: { type: String, default: "Admin" },
  },
  { timestamps: true },
)

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLogin: { type: Date },
  },
  { timestamps: true },
)

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    phone: { type: String, required: true },
    notes: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "rejected"],
      default: "new",
    },
    lastContacted: { type: Date },
  },
  { timestamps: true },
)

// Create models
const User = mongoose.model("User", userSchema)
const Agent = mongoose.model("Agent", agentSchema)
const Contact = mongoose.model("Contact", contactSchema)

// Sample data
const sampleAgents = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    mobile: "+1234567890",
    password: "password123",
    status: "active",
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    mobile: "+1987654321",
    password: "password123",
    status: "active",
  },
  {
    name: "Michael Brown",
    email: "michael.brown@example.com",
    mobile: "+1122334455",
    password: "password123",
    status: "active",
  },
]

const sampleContacts = [
  {
    firstName: "Alice",
    phone: "+1111111111",
    notes: "Interested in premium package",
    status: "new",
  },
  {
    firstName: "Bob",
    phone: "+2222222222",
    notes: "Call back next week",
    status: "contacted",
  },
  {
    firstName: "Charlie",
    phone: "+3333333333",
    notes: "Needs more information",
    status: "new",
  },
  {
    firstName: "David",
    phone: "+4444444444",
    notes: "Ready to purchase",
    status: "contacted",
  },
  {
    firstName: "Eve",
    phone: "+5555555555",
    notes: "Not interested",
    status: "rejected",
  },
  {
    firstName: "Frank",
    phone: "+6666666666",
    notes: "Left voicemail",
    status: "new",
  },
  {
    firstName: "Grace",
    phone: "+7777777777",
    notes: "Purchased basic package",
    status: "converted",
  },
  {
    firstName: "Heidi",
    phone: "+8888888888",
    notes: "Requested callback",
    status: "new",
  },
  {
    firstName: "Ivan",
    phone: "+9999999999",
    notes: "Interested in family plan",
    status: "contacted",
  },
]

// Seed function
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Agent.deleteMany({})
    await Contact.deleteMany({})

    console.log("✅ Cleared existing data")

    // Create admin user
    const salt = await bcrypt.genSalt(10)
    const adminPassword = await bcrypt.hash("admin123", salt)

    const admin = new User({
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      isAdmin: true,
    })

    await admin.save()
    console.log("✅ Created admin user")

    // Create agents
    const agentPromises = sampleAgents.map(async (agentData) => {
      const hashedPassword = await bcrypt.hash(agentData.password, salt)
      return new Agent({
        ...agentData,
        password: hashedPassword,
      })
    })

    const agents = await Promise.all(agentPromises)
    await Agent.insertMany(agents)
    console.log(`✅ Created ${agents.length} agents`)

    // Create contacts and distribute them
    const contacts = sampleContacts.map((contactData) => new Contact(contactData))
    await Contact.insertMany(contacts)
    console.log(`✅ Created ${contacts.length} contacts`)

    // Distribute contacts among agents
    const savedContacts = await Contact.find()
    const savedAgents = await Agent.find()

    const contactsPerAgent = Math.floor(savedContacts.length / savedAgents.length)
    const remainder = savedContacts.length % savedAgents.length

    let currentIndex = 0

    for (let i = 0; i < savedAgents.length; i++) {
      const agentContacts = savedContacts.slice(currentIndex, currentIndex + contactsPerAgent + (i < remainder ? 1 : 0))

      for (const contact of agentContacts) {
        await Contact.findByIdAndUpdate(contact._id, { assignedTo: savedAgents[i]._id })
      }

      currentIndex += agentContacts.length
    }

    console.log("✅ Distributed contacts among agents")
    console.log("✅ Database seeded successfully")

    // Disconnect from MongoDB
    await mongoose.disconnect()
    console.log("✅ Disconnected from MongoDB")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  }
}

// Run the seed function
seedDatabase()
