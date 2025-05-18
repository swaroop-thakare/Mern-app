const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "rejected"],
      default: "new",
    },
    lastContacted: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
contactSchema.index({ assignedTo: 1 })
contactSchema.index({ status: 1 })
contactSchema.index({ firstName: "text", notes: "text" })

const Contact = mongoose.model("Contact", contactSchema)

module.exports = Contact
