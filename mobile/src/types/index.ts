export interface User {
  id: string;
  phoneNumber: string;
  name?: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  repaidAt?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  activeAmount: number;
  stats: {
    totalCount: number;
    repaidCount: number;
    overdueCount: number;
    activeCount: number;
  };
}

export type LoanFilter = 'all' | 'active' | 'overdue' | 'repaid';
