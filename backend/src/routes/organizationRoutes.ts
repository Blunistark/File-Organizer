import express, { Router } from 'express';
import { suggestOrganization, applyOrganization } from '../controllers/organizationController';

const router: Router = express.Router();

// Suggest organization
router.post('/suggest/:fileId', suggestOrganization);

// Apply organization
router.post('/apply', applyOrganization);

export default router; 