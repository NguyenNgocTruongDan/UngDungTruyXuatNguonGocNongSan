const crypto = require("crypto");
const { ethers } = require("ethers");
const Batch = require("../models/Batch");

const agriTraceabilityAbi = [
  "function addEvent(string batchId, string actionType, string dataHash) external",
  "function getHistory(string batchId) external view returns (tuple(string actionType,uint256 timestamp,address actor,string dataHash)[])",
];

const normalizeImageUrls = (req) => {
  if (Array.isArray(req.body.imageUrls)) {
    return req.body.imageUrls.filter(Boolean);
  }

  if (typeof req.body.imageUrls === "string" && req.body.imageUrls.trim()) {
    return req.body.imageUrls
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(req.files)) {
    return req.files
      .map((file) => file.path || file.secure_url || file.url)
      .filter(Boolean);
  }

  return [];
};

const buildEventHash = ({ batchId, eventId, actionType, note, imageUrls, createdAt }) => {
  const payload = {
    batchId,
    eventId,
    actionType,
    note,
    imageUrls,
    createdAt,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};

const getContract = () => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const contractAddress = process.env.SMART_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error(
      "Blockchain environment variables are missing. Required: BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, SMART_CONTRACT_ADDRESS."
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  return {
    wallet,
    contract: new ethers.Contract(contractAddress, agriTraceabilityAbi, wallet),
  };
};

const getTimeline = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ message: "batchId is required" });
    }

    const batch = await Batch.findOne({ batchId })
      .populate("owner", "first_name last_name email role")
      .populate("events.createdBy", "first_name last_name email role")
      .lean();

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    return res.status(200).json({
      message: "Timeline fetched successfully",
      batch,
    });
  } catch (error) {
    console.error("getTimeline error:", error);
    return res.status(500).json({
      message: "Failed to fetch timeline",
      error: error.message,
    });
  }
};

const addFarmingEvent = async (req, res) => {
  let batch;
  let savedEvent;

  try {
    const { batchId, actionType, note = "" } = req.body;

    if (!batchId || !actionType) {
      return res.status(400).json({
        message: "batchId and actionType are required",
      });
    }

    batch = await Batch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const imageUrls = normalizeImageUrls(req);

    batch.events.push({
      actionType,
      note,
      imageUrls,
      createdBy: req.user?._id || null,
      onChainStatus: "pending",
    });

    await batch.save();

    savedEvent = batch.events[batch.events.length - 1];

    const dataHash = buildEventHash({
      batchId: batch.batchId,
      eventId: savedEvent._id.toString(),
      actionType: savedEvent.actionType,
      note: savedEvent.note,
      imageUrls: savedEvent.imageUrls,
      createdAt: savedEvent.createdAt.toISOString(),
    });

    const { wallet, contract } = getContract();
    const tx = await contract.addEvent(batch.batchId, savedEvent.actionType, dataHash);
    const receipt = await tx.wait();

    savedEvent.dataHash = dataHash;
    savedEvent.transactionHash = tx.hash;
    savedEvent.blockNumber = receipt ? Number(receipt.blockNumber) : null;
    savedEvent.actor = wallet.address;
    savedEvent.onChainStatus = "confirmed";

    await batch.save();

    return res.status(201).json({
      message: "Farming event added successfully",
      batchId: batch.batchId,
      event: savedEvent,
      transactionHash: tx.hash,
      dataHash,
    });
  } catch (error) {
    console.error("addFarmingEvent error:", error);

    if (batch && savedEvent) {
      try {
        savedEvent.onChainStatus = "failed";
        await batch.save();
      } catch (saveError) {
        console.error("Failed to persist failed onChainStatus:", saveError);
      }
    }

    return res.status(500).json({
      message: "Failed to add farming event",
      error: error.message,
    });
  }
};

module.exports = {
  getTimeline,
  addFarmingEvent,
};
