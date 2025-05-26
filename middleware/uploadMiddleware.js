const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const User = require("../models/user.model");

const ensureUserDirectory = async (userId) => {
  const userDir = path.join("uploads", "users", userId.toString(), "My Drive");
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
};

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const userDir = await ensureUserDirectory(req.user._id);
      cb(null, userDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const safeFileName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, "");
    cb(null, `${Date.now()}-${safeFileName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "text/plain"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, PDF, and TXT are allowed!"), false);
  }
};

const checkStorage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const fileSize = req.file ? req.file.size : parseInt(req.headers["content-length"]);
    if (user.usedStorage + fileSize > user.storageLimit) {
      return res.status(400).json({ message: "Storage limit of 16GB exceeded" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error during storage check" });
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = { upload, checkStorage };
















// const multer = require("multer");
// const path = require("path");
// const fs = require("fs").promises;
// const User = require("../models/user.model"); // Adjust path to your User model

// // Ensure user directory exists
// const ensureUserDirectory = async (userId) => {
//   const userDir = path.join("uploads", "users", userId.toString(), "My Drive");
//   await fs.mkdir(userDir, { recursive: true });
//   return userDir;
// };

// // Set up storage engine
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     try {
//       const userDir = await ensureUserDirectory(req.user._id);
//       cb(null, userDir); // Store in user's root folder
//     } catch (error) {
//       cb(error);
//     }
//   },
//   filename: function (req, file, cb) {
//     // Sanitize filename to prevent path traversal
//     const safeFileName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, "");
//     cb(null, `${Date.now()}-${safeFileName}`);
//   },
// });

// // File filter to allow only specific file types
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file type. Only JPG, PNG, PDF, and TXT are allowed!"), false);
//   }
// };

// // Check storage limit
// const checkStorage = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const fileSize = req.file ? req.file.size : parseInt(req.headers["content-length"]);
//     if (user.usedStorage + fileSize > user.storageLimit) {
//       return res.status(400).json({ message: "Storage limit of 16GB exceeded" });
//     }
//     next();
//   } catch (error) {
//     res.status(500).json({ message: "Server error during storage check" });
//   }
// };

// // Initialize multer
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
//   fileFilter: fileFilter,
// });

// module.exports = { upload, checkStorage };
















// // const multer = require("multer");
// // const path = require("path");

// // // Set up storage engine
// // const storage = multer.diskStorage({
// //     destination: function (req, file, cb) {
// //         cb(null, "uploads/"); // Files will be stored in the "uploads" directory
// //     },
// //     filename: function (req, file, cb) {
// //         cb(null, Date.now() + "-" + file.originalname); // Unique filename
// //     }
// // });

// // // File filter to allow only specific file types
// // const fileFilter = (req, file, cb) => {
// //     const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
    
// //     if (allowedTypes.includes(file.mimetype)) {
// //         cb(null, true);
// //     } else {
// //         cb(new Error("Invalid file type. Only JPG, PNG, PDF, and TXT are allowed!"), false);
// //     }
// // };

// // // Initialize multer
// // const upload = multer({
// //     storage: storage,
// //     limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
// //     fileFilter: fileFilter
// // });

// // module.exports = upload;
