const mongoose = require("mongoose");

const farmingEventSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    dataHash: {
      type: String,
      default: null,
    },
    transactionHash: {
      type: String,
      default: null,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    actor: {
      type: String,
      default: null,
    },
    onChainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productType: {
      type: String,
      default: "",
      trim: true,
    },
    origin: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "active",
    },
    qrCodeUrl: {
      type: String,
      default: "",
      trim: true,
    },
    events: {
      type: [farmingEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Batch || mongoose.model("Batch", batchSchema);
