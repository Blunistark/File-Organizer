import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router: Router = express.Router();

// List all tags
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany();
    res.status(200).json({ success: true, data: tags });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching tags', error: error.message });
  }
});

export default router; 