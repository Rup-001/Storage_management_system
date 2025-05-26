const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const User = require("../models/user.model");
const fs = require("fs").promises;

exports.createFolder = async (req, res) => {
  const { name } = req.body;
  try {
    const rootFolder = await Folder.findOne({ user: req.user._id, parentFolder: null });
    if (!rootFolder) {
      return res.status(404).json({ message: "Root folder not found" });
    }
    const existingFolder = await Folder.findOne({
      name: name,
      user: req.user._id,
      parentFolder: parentFolder._id,
    });
    if (existingFolder) {
      return res.status(400).json({ message: "A folder with this name already exists in the parent folder" });
    }
    const newFolder = new Folder({
      name,
      user: req.user._id,
      parentFolder: rootFolder._id,
    });
    await newFolder.save();
    res.status(201).json({ message: "Folder created", folder: newFolder });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createFolderInsideFolder = async (req, res) => {
  const { name, parentFolderId } = req.body;
  try {
    const parentFolder = await Folder.findOne({ _id: parentFolderId, user: req.user._id });
    if (!parentFolder) {
      return res.status(404).json({ message: "Parent folder not found" });
    }
    const existingFolder = await Folder.findOne({
      name: name,
      user: req.user._id,
      parentFolder: parentFolder._id,
    });
    if (existingFolder) {
      return res.status(400).json({ message: "A folder with this name already exists in the parent folder" });
    }
    const newFolder = new Folder({
      name,
      user: req.user._id,
      parentFolder: parentFolder._id,
    });
    await newFolder.save();
    res.status(201).json({ message: "Folder created", folder: newFolder });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  } finally {
    console.log("createFolderInsideFolder attempt done")
  }
};

exports.toggleFavorite = async (req, res) => {
  const { folderId } = req.body;
  try {
    const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    folder.isFavorite = !folder.isFavorite;
    await folder.save();
    res.status(200).json({ message: "Folder favorite status updated", folder });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.renameFolder = async (req, res) => {
  const { folderId, newName } = req.body;
  try {
    const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    folder.name = newName;
    await folder.save();
    res.status(200).json({ message: "Folder renamed", folder });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFolder = async (req, res) => {
  const folderId = req.params.id; // Changed from req.body to req.query
  try {
    const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Recursive function to delete folder and its contents
    const deleteFolderRecursively = async (folderId) => {
      // Find all files in the current folder
      const files = await File.find({ parentFolder: folderId, user: req.user._id });
      let totalSize = 0;

      // Delete files and calculate total size
      for (const file of files) {
        try {
          await fs.unlink(file.fileUrl); // Delete file from storage
          totalSize += file.size;
        } catch (fileError) {
          console.error(`Error deleting file ${file.fileUrl}:`, fileError);
        }
        await file.deleteOne();
      }

      // Find all subfolders
      const subFolders = await Folder.find({ parentFolder: folderId, user: req.user._id });

      // Recursively delete subfolders
      for (const subFolder of subFolders) {
        await deleteFolderRecursively(subFolder._id);
      }

      // Delete the current folder
      await Folder.deleteOne({ _id: folderId, user: req.user._id });

      return totalSize;
    };

    // Prevent deletion of the root folder
    if (!folder.parentFolder) {
      return res.status(400).json({ message: "Cannot delete root folder" });
    }

    // Delete folder and its contents, get total size of deleted files
    const deletedSize = await deleteFolderRecursively(folderId);

    // Update user's usedStorage
    if (deletedSize > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { usedStorage: -deletedSize },
      });
    }

    res.status(200).json({ message: "Folder and its contents deleted" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.shareFolder = async (req, res) => {
  const { folderId, shareWithUserId } = req.body;
  try {
    const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    const shareWithUser = await User.findById(shareWithUserId);
    if (!shareWithUser) {
      return res.status(404).json({ message: "User to share with not found" });
    }
    if (!folder.sharedWith.includes(shareWithUserId)) {
      folder.sharedWith.push(shareWithUserId);
      await folder.save();
    }
    res.status(200).json({ message: "Folder shared", folder });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.listFolderContents = async (req, res) => {
  const folderId = req.params.folderId;
  const { fileType } = req.query;
  try {
    const parentFolder = folderId
      ? await Folder.findOne({ _id: folderId, user: req.user._id })
      : await Folder.findOne({ user: req.user._id, parentFolder: null });
    if (!parentFolder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    const folders = await Folder.find({ parentFolder: parentFolder._id, user: req.user._id });
    const folderName = parentFolder.name; 
    let filesQuery = { parentFolder: parentFolder._id, user: req.user._id };
    if (fileType) {
      filesQuery.mimeType = fileType;
    }
    const files = await File.find(filesQuery);
    res.status(200).json({ message: "Folder contents retrieved", folderName, folders, files });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};