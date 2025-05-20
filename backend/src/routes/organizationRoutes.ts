import express, { Router } from 'express';
import { suggestOrganization, applyOrganization, batchSuggestOrganization, folderSuggestOrganization } from '../controllers/organizationController';

const router: Router = express.Router();

// Suggest organization
router.post('/suggest/:fileId', suggestOrganization);

// Batch organization suggestion
router.post('/batch-suggest', batchSuggestOrganization);

// Folder organization suggestion
router.post('/folder-suggest', folderSuggestOrganization);

// Apply organization
router.post('/apply', applyOrganization);

export default router; 