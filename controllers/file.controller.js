const File = require("../models/file.model");
const Folder = require("../models/folder.model");
const User = require("../models/user.model");
const fs = require("fs").promises;
const path = require("path");
const { checkStorage } = require("../middleware/uploadMiddleware");

exports.uploadFile = [
  checkStorage,
  async (req, res) => {
    try {
      const { parentFolderId } = req.body;
      const parentFolder = parentFolderId
        ? await Folder.findOne({ _id: parentFolderId, user: req.user._id })
        : await Folder.findOne({ user: req.user._id, parentFolder: null });
      if (!parentFolder) {
        return res.status(404).json({ message: "Parent folder not found" });
      }
      const newFile = new File({
        name: req.file.originalname,
        user: req.user._id,
        parentFolder: parentFolder._id,
        fileUrl: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
      await newFile.save();
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { usedStorage: req.file.size },
      });
      res.status(201).json({
        message: "File uploaded",
        file: newFile,
        storage: { used: req.user.usedStorage + req.file.size, limit: req.user.storageLimit },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.toggleFavorite = async (req, res) => {
  const { fileId } = req.body;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    file.isFavorite = !file.isFavorite;
    await file.save();
    res.status(200).json({ message: "File favorite status updated", file });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.renameFile = async (req, res) => {
  const { fileId, newName } = req.body;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    file.name = newName;
    await file.save();
    res.status(200).json({ message: "File renamed", file });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFile = async (req, res) => {
  const fileId = req.params.id;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    await fs.unlink(file.fileUrl);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { usedStorage: -file.size },
    });
    await file.deleteOne();
    res.status(200).json({ message: "File deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.shareFile = async (req, res) => {
  const { fileId, shareWithUserId } = req.body;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    const shareWithUser = await User.findById(shareWithUserId);
    if (!shareWithUser) {
      return res.status(404).json({ message: "User to share with not found" });
    }
    if (!file.sharedWith.includes(shareWithUserId)) {
      file.sharedWith.push(shareWithUserId);
      await file.save();
    }
    res.status(200).json({ message: "File shared", file });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createNote = async (req, res) => {
  const { content, name, parentFolderId } = req.body;
  try {
    const parentFolder = parentFolderId
      ? await Folder.findOne({ _id: parentFolderId, user: req.user._id })
      : await Folder.findOne({ user: req.user._id, parentFolder: null });
    if (!parentFolder) {
      return res.status(404).json({ message: "Parent folder not found" });
    }
    // Check storage
    const contentSize = Buffer.byteLength(content, "utf8");
    const user = await User.findById(req.user._id);
    if (user.usedStorage + contentSize > user.storageLimit) {
      return res.status(400).json({ message: "Storage limit of 16GB exceeded" });
    }
    // Create note file
    const safeFileName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, "")}.txt`;
    const filePath = path.join("uploads", "users", req.user._id.toString(), "My Drive", safeFileName);
    await fs.writeFile(filePath, content);
    // Save file metadata
    const newFile = new File({
      name: `${name}.txt`,
      user: req.user._id,
      parentFolder: parentFolder._id,
      fileUrl: filePath,
      size: contentSize,
      mimeType: "text/plain",
    });
    await newFile.save();
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { usedStorage: contentSize },
    });
    res.status(201).json({ message: "Note created", file: newFile });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
    console.log("error", error)
  }
};

exports.readNote = async (req, res) => {
  const fileId = req.params.id;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file || !file.name.endsWith(".txt")) {
      return res.status(404).json({ message: "Note not found" });
    }
    const content = await fs.readFile(file.fileUrl, "utf8");
    res.status(200).json({ message: "Note retrieved", file, content });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateNote = async (req, res) => {
  const fileId = req.params.id;
  const { content } = req.body;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file || !file.name.endsWith(".txt")) {
      return res.status(404).json({ message: "Note not found" });
    }
    // Check storage
    const newSize = Buffer.byteLength(content, "utf8");
    const sizeDiff = newSize - file.size;
    const user = await User.findById(req.user._id);
    if (user.usedStorage + sizeDiff > user.storageLimit) {
      return res.status(400).json({ message: "Storage limit of 16GB exceeded" });
    }
    // Update file content
    await fs.writeFile(file.fileUrl, content);
    file.size = newSize;
    await file.save();
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { usedStorage: sizeDiff },
    });
    res.status(200).json({ message: "Note updated", file });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



exports.viewFile = async (req, res) => {
  const fileId = req.params.id;
  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    // Check if file is image, PDF, or text
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
    // Fallback to file extension if mimeType is missing
    let isAllowed = allowedTypes.includes(file.mimeType);
    if (!file.mimeType) {
      const extension = file.name.toLowerCase().split(".").pop();
      const extensionToMime = {
        jpg: "image/jpg",
        jpeg: "image/jpeg",
        png: "image/png",
        pdf: "application/pdf",
        txt: "text/plain",
      };
      isAllowed = allowedTypes.includes(extensionToMime[extension]);
    }
    if (!isAllowed) {
      return res.status(400).json({ message: "File type not supported for viewing" });
    }
    res.status(200).json({ message: "File retrieved", fileUrl: file.fileUrl });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.listFavorites = async (req, res) => {
  try {
    const favoriteFolders = await Folder.find({ user: req.user._id, isFavorite: true });
    const favoriteFiles = await File.find({ user: req.user._id, isFavorite: true });
    res.status(200).json({
      message: "Favorite items retrieved",
      folders: favoriteFolders,
      files: favoriteFiles,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.listFilesByDate = async (req, res) => {
  const { date } = req.query; // Expect date in YYYY-MM-DD format
  try {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    // Create UTC date range for the entire day
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }
    // Query files in UTC date range
    const files = await File.find({
      user: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate },
    });
    res.status(200).json({ message: "Files retrieved for date", date, files });
  } catch (error) {
    console.error("Error listing files by date:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStorageSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Get total folders
    const totalFolders = await Folder.countDocuments({ user: req.user._id });
    // Aggregate file stats by mimeType
    const fileStats = await File.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$mimeType",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
    ]);
    // Initialize summary
    const summary = {
      totalStorage: {
        used: user.usedStorage,
        available: user.storageLimit - user.usedStorage,
        limit: user.storageLimit,
      },
      folders: { count: totalFolders, totalSize: 0 }, // Folders don't have direct size
      notes: { count: 0, totalSize: 0 },
      images: { count: 0, totalSize: 0 },
      pdfs: { count: 0, totalSize: 0 },
    };
    // Map file stats to summary
    fileStats.forEach((stat) => {
      if (stat._id === "text/plain") {
        summary.notes = { count: stat.count, totalSize: stat.totalSize };
      } else if (["image/jpeg", "image/png"].includes(stat._id)) {
        summary.images.count += stat.count;
        summary.images.totalSize += stat.totalSize;
      } else if (stat._id === "application/pdf") {
        summary.pdfs = { count: stat.count, totalSize: stat.totalSize };
      }
    });
    res.status(200).json({ message: "Storage summary retrieved", summary });
  } catch (error) {
    console.error("Error fetching storage summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};