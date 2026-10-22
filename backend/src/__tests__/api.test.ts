import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('MiniLedger Backend API Integration Tests', () => {
  const testPhone = '+919999988888';
  let authToken = '';
  let activeLoanId = '';
  let overdueLoanId = '';

  beforeAll(async () => {
    // Clean up any existing test data
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: testPhone.replace(/[\s\-()]/g, '') },
    });
    if (existingUser) {
      await prisma.loan.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }
  });

  afterAll(async () => {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: testPhone.replace(/[\s\-()]/g, '') },
    });
    if (existingUser) {
      await prisma.loan.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }
    await prisma.otpVerification.deleteMany({
      where: { phoneNumber: testPhone.replace(/[\s\-()]/g, '') },
    });
    await prisma.$disconnect();
  });

  describe('1. Health Check', () => {
    it('GET /api/health should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Authentication Flow (Mock OTP)', () => {
    let mockOtp = '';

    it('POST /api/auth/send-otp should fail with invalid phone', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/send-otp should succeed and log mock OTP', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: testPhone });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.debugOtp).toBeDefined();
      mockOtp = res.body.debugOtp;
    });

    it('POST /api/auth/verify-otp should fail with wrong OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, code: '000000' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/verify-otp should succeed with correct OTP and issue JWT', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, code: mockOtp });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });
  });

  describe('3. Loan Entry Management & Validation', () => {
    it('POST /api/loans should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/loans')
        .send({ friendName: 'Alice', amount: 500, dueDate: '2026-12-31' });
      expect(res.status).toBe(401);
    });

    it('POST /api/loans should reject negative or zero amount', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ friendName: 'Alice', amount: -50, dueDate: '2026-12-31' });
      expect(res.status).toBe(400);
    });

    it('POST /api/loans should create an active loan (due in future)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Rohan Sharma',
          amount: 2500,
          dueDate: futureDate.toISOString(),
          notes: 'Dinner and movie tickets',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendName).toBe('Rohan Sharma');
      expect(res.body.data.amount).toBe(2500);
      expect(res.body.data.isOverdue).toBe(false);
      expect(res.body.data.isRepaid).toBe(false);
      activeLoanId = res.body.data.id;
    });

    it('POST /api/loans should create an overdue loan (due in past)', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Priya Patel',
          amount: 1500,
          dueDate: pastDate.toISOString(),
          notes: 'Concert pass',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendName).toBe('Priya Patel');
      expect(res.body.data.amount).toBe(1500);
      expect(res.body.data.isOverdue).toBe(true);
      overdueLoanId = res.body.data.id;
    });

    it('GET /api/loans should list all created loans with overdue flag', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      const overdueLoan = res.body.data.find((l: any) => l.id === overdueLoanId);
      expect(overdueLoan.isOverdue).toBe(true);
    });
  });

  describe('4. Summary Endpoint Calculation', () => {
    it('GET /api/loans/summary should accurately calculate totals and overdue amount', async () => {
      const res = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { totalLent, totalRepaid, overdueAmount } = res.body.data;

      // 2500 (Rohan) + 1500 (Priya) = 4000
      expect(totalLent).toBe(4000);
      expect(totalRepaid).toBe(0);
      // Priya's 1500 is overdue
      expect(overdueAmount).toBe(1500);
    });
  });

  describe('5. Mark as Repaid & Recalculate Summary', () => {
    it('PATCH /api/loans/:id/repay should mark overdue loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/loans/${overdueLoanId}/repay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isRepaid: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRepaid).toBe(true);
      expect(res.body.data.isOverdue).toBe(false);
    });

    it('GET /api/loans/summary should update totals after repayment', async () => {
      const res = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const { totalLent, totalRepaid, overdueAmount } = res.body.data;

      expect(totalLent).toBe(4000);
      expect(totalRepaid).toBe(1500);
      expect(overdueAmount).toBe(0);
    });
  });
});
