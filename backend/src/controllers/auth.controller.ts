import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const sendOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .min(8, 'Phone number must have at least 8 digits')
      .max(16, 'Phone number must have at most 16 digits')
      .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(8, 'Phone number is required'),
    code: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');

    // Generate random 6-digit mock OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate previous active OTPs for this phone number
    await prisma.otpVerification.updateMany({
      where: {
        phoneNumber: cleanPhone,
        consumed: false,
      },
      data: {
        consumed: true,
      },
    });

    // Store new OTP
    await prisma.otpVerification.create({
      data: {
        phoneNumber: cleanPhone,
        code,
        expiresAt,
      },
    });

    // Requirement: "Phone number login with a mock OTP (just print the OTP in the server log)"
    console.log('\n======================================================');
    console.log(`🔐 [MiniLedger AUTH] Mock OTP for: ${cleanPhone}`);
    console.log(`⭐ OTP Code: >>> ${code} <<<`);
    console.log(`⏳ Valid for 5 minutes (until ${expiresAt.toLocaleTimeString()})`);
    console.log('======================================================\n');

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check the server console log for the mock OTP.',
      // In development mode, we also return debugOtp so testing is instant
      debugOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OTP',
    });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, code } = req.body;
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');

    const record = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: cleanPhone,
        code,
        consumed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
      return;
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { consumed: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: cleanPhone,
        },
      });
    }

    const secret = process.env.JWT_SECRET || 'miniledger_default_secret_key';
    const token = jwt.sign(
      {
        userId: user.id,
        phoneNumber: user.phoneNumber,
      },
      secret,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, phoneNumber: true, name: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};
