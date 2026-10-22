import { Router } from 'express';
import {
  createLoan,
  getLoans,
  markLoanAsRepaid,
  getLoanSummary,
  deleteLoan,
  createLoanSchema,
  updateLoanStatusSchema,
} from '../controllers/loan.controller';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { receiptUpload } from '../middleware/upload';

const router = Router();

// All loan endpoints require authentication
router.use(authenticateToken);

// Summary endpoint (placed before /:id routes to avoid route matching conflicts)
router.get('/summary', getLoanSummary);

// List loans with optional status/sort filters
router.get('/', getLoans);

// Create loan (with optional receipt file upload)
router.post(
  '/',
  receiptUpload.single('receipt'),
  validateRequest(createLoanSchema),
  createLoan
);

// Mark loan as repaid
router.patch('/:id/repay', validateRequest(updateLoanStatusSchema), markLoanAsRepaid);

// Delete loan
router.delete('/:id', deleteLoan);

export default router;
