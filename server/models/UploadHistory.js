const mongoose = require("mongoose")

const uploadHistorySchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    recordCount: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    errorMessage: {
      type: String,
    },
    processingTime: {
      type: Number, // in milliseconds
    },
  },
  {
    timestamps: true,
  },
)

const UploadHistory = mongoose.model("UploadHistory", uploadHistorySchema)

module.exports = UploadHistory
