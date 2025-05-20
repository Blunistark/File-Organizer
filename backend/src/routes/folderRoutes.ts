import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router: Router = express.Router();

// Create a folder
router.post('/', async (req, res) => {
  const { name, parentId, path } = req.body;
  if (!name || !path) {
    return res.status(400).json({ success: false, message: 'Name and path are required' });
  }
  try {
    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        path,
        userId: 'demo-user', // TODO: Replace with real user ID after auth
      },
    });
    res.status(201).json({ success: true, data: folder, message: 'Folder created' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating folder', error: error.message });
  }
});

// List folders
router.get('/', async (req, res) => {
  try {
    const folders = await prisma.folder.findMany();
    res.status(200).json({ success: true, data: folders, message: 'Folders listed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching folders', error: error.message });
  }
});

// Get a specific folder
router.get('/:id', async (req, res) => {
  // Stub: implement retrieval later
  res.status(200).json({ success: true, message: `Folder with ID ${req.params.id} retrieved (stub)` });
});

// Delete a folder
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Recursively delete all child folders and all files in every folder
    const deleteFolderAndChildren = async (folderId: string) => {
      // Find all files in this folder
      const files = await prisma.file.findMany({ where: { folderId } });
      const fileIds = files.map(f => f.id);
      // Delete all file tags for these files
      if (fileIds.length > 0) {
        await prisma.fileTag.deleteMany({ where: { fileId: { in: fileIds } } });
      }
      // Delete all files in this folder
      await prisma.file.deleteMany({ where: { folderId } });
      // Recursively delete all child folders
      const children = await prisma.folder.findMany({ where: { parentId: folderId } });
      for (const child of children) {
        await deleteFolderAndChildren(child.id);
      }
      // Delete the folder itself
      await prisma.folder.delete({ where: { id: folderId } });
    };
    await deleteFolderAndChildren(id);
    res.status(200).json({ success: true, message: `Folder with ID ${id} and its children deleted` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting folder', error: error.message });
  }
});

// Update a folder (rename)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, path } = req.body;
  if (!name || !path) {
    return res.status(400).json({ success: false, message: 'Name and path are required' });
  }
  try {
    const folder = await prisma.folder.update({
      where: { id },
      data: { name, path },
    });
    res.status(200).json({ success: true, data: folder, message: 'Folder updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error updating folder', error: error.message });
  }
});

export default router; 