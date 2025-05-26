const express = require("express");
const folderRouter = express.Router();
const authMiddleware = require("../middleware/isUnauthorized");
const folderController = require("../controllers/folder.controller");

folderRouter.post("/create-folder", authMiddleware, folderController.createFolder);
folderRouter.post("/create-folder-inside-folder", authMiddleware, folderController.createFolderInsideFolder);
folderRouter.post("/toggle-favorite", authMiddleware, folderController.toggleFavorite);
folderRouter.post("/rename", authMiddleware, folderController.renameFolder);
folderRouter.delete("/delete/:id", authMiddleware, folderController.deleteFolder);
folderRouter.post("/share", authMiddleware, folderController.shareFolder);
folderRouter.get("/list/:folderId?", authMiddleware, folderController.listFolderContents);

module.exports = folderRouter;