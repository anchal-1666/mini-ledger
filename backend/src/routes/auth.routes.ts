import { Router } from 'express';
import { sendOtp, verifyOtp, getMe, sendOtpSchema, verifyOtpSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/send-otp', validateRequest(sendOtpSchema), sendOtp);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.get('/me', authenticateToken, getMe);

export default router;
