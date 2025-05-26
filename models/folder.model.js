const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  isFavorite: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Add indexes for faster queries
folderSchema.index({ user: 1, parentFolder: 1 });

module.exports = mongoose.model("Folder", folderSchema);












// const mongoose = require("mongoose");

// const folderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   parentFolder: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Folder",
//     default: null,
//   }, // Parent folder (null if root)

//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("folder", folderSchema);
