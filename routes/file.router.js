const express = require("express");
const fileRouter = express.Router();
const authMiddleware = require("../middleware/isUnauthorized");
const fileController = require("../controllers/file.controller");
const { upload, checkStorage } = require("../middleware/uploadMiddleware");

fileRouter.post("/upload-file", authMiddleware, upload.single("file"), checkStorage, fileController.uploadFile);
fileRouter.post("/toggle-favorite", authMiddleware, fileController.toggleFavorite);
fileRouter.post("/rename", authMiddleware, fileController.renameFile);
fileRouter.delete("/delete/:id", authMiddleware, fileController.deleteFile);
fileRouter.post("/share", authMiddleware, fileController.shareFile);
fileRouter.post("/create-note", authMiddleware, checkStorage, fileController.createNote);
fileRouter.get("/read-note/:id", authMiddleware, fileController.readNote);
fileRouter.patch("/update-note/:id", authMiddleware, checkStorage, fileController.updateNote);
fileRouter.get("/view/:id", authMiddleware, fileController.viewFile);
fileRouter.get("/favorites", authMiddleware, fileController.listFavorites);
fileRouter.get("/files-by-date", authMiddleware, fileController.listFilesByDate);
fileRouter.get("/storage-summary", authMiddleware, fileController.getStorageSummary);
module.exports = fileRouter;