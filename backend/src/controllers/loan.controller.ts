import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const createLoanSchema = z.object({
  body: z.object({
    friendName: z.string().trim().min(1, 'Friend name is required').max(100),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    }),
    notes: z.string().max(500).optional(),
  }),
});

export const updateLoanStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid loan ID format'),
  }),
  body: z.object({
    isRepaid: z.boolean().optional(),
  }).optional(),
});

/**
 * Add a new loan entry
 * Requirements: friend name, amount, due date (+ optional receipt photo)
 */
export const createLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { friendName, amount, dueDate, notes } = req.body;

    // Optional receipt photo uploaded via multer
    let receiptUrl: string | undefined = undefined;
    if (req.file) {
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const parsedDueDate = new Date(dueDate);

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: friendName.trim(),
        amount: parseFloat(amount),
        dueDate: parsedDueDate,
        notes: notes ? notes.trim() : null,
        receiptUrl: receiptUrl || null,
        isRepaid: false,
      },
    });

    const isOverdue = !loan.isRepaid && loan.dueDate < new Date();

    res.status(201).json({
      success: true,
      message: 'Loan entry created successfully',
      data: {
        ...loan,
        isOverdue,
      },
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ success: false, message: 'Failed to create loan' });
  }
};

/**
 * List all loan entries for the authenticated user
 * Computes overdue flag and supports filter/sort
 */
export const getLoans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { status, sort = 'dueDate_asc' } = req.query;

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy:
        sort === 'dueDate_desc'
          ? { dueDate: 'desc' }
          : sort === 'amount_desc'
          ? { amount: 'desc' }
          : sort === 'amount_asc'
          ? { amount: 'asc' }
          : sort === 'created_desc'
          ? { createdAt: 'desc' }
          : { dueDate: 'asc' },
    });

    const now = new Date();

    const formattedLoans = loans.map((loan) => {
      const isOverdue = !loan.isRepaid && new Date(loan.dueDate) < now;
      return {
        ...loan,
        isOverdue,
      };
    });

    // Optional filtering
    let filtered = formattedLoans;
    if (status === 'overdue') {
      filtered = formattedLoans.filter((l) => l.isOverdue && !l.isRepaid);
    } else if (status === 'active') {
      // Active entries: unrepaid and NOT overdue
      filtered = formattedLoans.filter((l) => !l.isRepaid && !l.isOverdue);
    } else if (status === 'repaid') {
      filtered = formattedLoans.filter((l) => l.isRepaid);
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve loans' });
  }
};

/**
 * Mark a loan entry as repaid
 */
export const markLoanAsRepaid = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const existingLoan = await prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!existingLoan) {
      res.status(404).json({ success: false, message: 'Loan entry not found' });
      return;
    }

    // Toggle or explicitly mark as repaid
    const shouldMarkRepaid = req.body?.isRepaid !== undefined ? req.body.isRepaid : true;

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        isRepaid: shouldMarkRepaid,
        repaidAt: shouldMarkRepaid ? new Date() : null,
      },
    });

    const isOverdue = !updated.isRepaid && updated.dueDate < new Date();

    res.status(200).json({
      success: true,
      message: shouldMarkRepaid ? 'Loan marked as repaid' : 'Loan marked as active',
      data: {
        ...updated,
        isOverdue,
      },
    });
  } catch (error) {
    console.error('Error updating loan status:', error);
    res.status(500).json({ success: false, message: 'Failed to update loan status' });
  }
};

/**
 * Summary API
 * Returns: total lent, total repaid, overdue amount
 */
export const getLoanSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const allLoans = await prisma.loan.findMany({
      where: { userId },
    });

    const now = new Date();

    let totalLent = 0;
    let totalRepaid = 0;
    let overdueAmount = 0;
    let activeAmount = 0;

    let totalCount = allLoans.length;
    let repaidCount = 0;
    let overdueCount = 0;
    let activeCount = 0;

    for (const loan of allLoans) {
      totalLent += loan.amount;

      if (loan.isRepaid) {
        totalRepaid += loan.amount;
        repaidCount++;
      } else {
        if (new Date(loan.dueDate) < now) {
          overdueAmount += loan.amount;
          overdueCount++;
        } else {
          activeAmount += loan.amount;
          activeCount++;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalLent: Math.round(totalLent * 100) / 100,
        totalRepaid: Math.round(totalRepaid * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        activeAmount: Math.round(activeAmount * 100) / 100,
        stats: {
          totalCount,
          repaidCount,
          overdueCount,
          activeCount,
        },
      },
    });
  } catch (error) {
    console.error('Error calculating summary:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate summary' });
  }
};

/**
 * Delete a loan entry
 */
export const deleteLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const existingLoan = await prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!existingLoan) {
      res.status(404).json({ success: false, message: 'Loan entry not found' });
      return;
    }

    await prisma.loan.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Loan entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to delete loan' });
  }
};
