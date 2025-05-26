const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isFavorite: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Add indexes for faster queries
fileSchema.index({ user: 1, parentFolder: 1 });

module.exports = mongoose.model("File", fileSchema);










// const mongoose = require("mongoose");

// const fileSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   }, // File name
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   }, // Who uploaded the file
//   parentFolder: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Folder",
//     default: null,
//   }, // Where it’s stored
//   fileUrl: {
//     type: String,
//     required: true,
//   }, // Path to file
//   size: {
//     type: Number,
//     required: true,
//   }, // File size in bytes
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("file", fileSchema);
