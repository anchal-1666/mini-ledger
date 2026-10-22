<p align="center">
  <img src="./assets/logo.png" alt="MiniLedger Logo" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">💰 MiniLedger</h1>

<p align="center">
  <em>Smart, effortless tracking for money lent to friends</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-Expo-000020?logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-13%20Passed-brightgreen?logo=jest" />
</p>

---

MiniLedger is a full-stack application designed to track money lent to friends, manage due dates, highlight overdue loans, and maintain an accurate financial summary.

Built with **Node.js + TypeScript + PostgreSQL** (Backend) and **React Native / Expo** (Frontend).

---

## 🌟 Key Features

### 🔐 1. Mock OTP Authentication
- Phone number-based login.
- Generates a 6-digit mock OTP and prints it directly to the server console log.
- Issues secure JWT tokens for session persistence.

### 📋 2. Loan Entry Management
- Record loans with friend's name, amount, and due date.
- Optional notes and optional **receipt photo upload** (bonus).
- Single-tap **"Mark as Repaid"** / **"Mark as Unpaid"** action.
- Status filters: **All**, **Overdue**, **Active**, and **Repaid**.

### ⚠️ 3. Overdue Highlighting
- Automatic detection of overdue loans (`dueDate < today` and not yet repaid).
- Distinctive visual highlighting on both the **Summary Card** and individual **Loan Cards** (red alert badge, overdue banner, and days overdue counter).

### 📊 4. Financial Summary Card
Real-time financial dashboard displaying:
- **Total Lent**: Cumulative amount lent across all records.
- **Total Repaid**: Amount returned by friends.
- **Overdue Pending**: Amount currently overdue that needs follow-up.
- **Active Loans Count**: Number of unresolved loans.

### 🎁 Bonus Features Included
- **Receipt Photo Attachment**: Take a photo or upload from gallery via Multer static file serving.
- **Robust Input Validation**: Strict validation schemas powered by **Zod** on the backend and client-side form validation on the mobile app.
- **Automated Test Suite**: 13 end-to-end integration tests written with **Jest + Supertest**.

---

## 🏗️ Architecture & Tech Stack

```text
react_native_assignment/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # PostgreSQL schema (User, OtpVerification, Loan)
│   ├── src/
│   │   ├── controllers/          # auth.controller.ts, loan.controller.ts
│   │   ├── middleware/           # auth.ts (JWT), upload.ts (Multer), validate.ts (Zod)
│   │   ├── routes/               # auth.routes.ts, loan.routes.ts
│   │   ├── __tests__/            # api.test.ts (Jest + Supertest integration tests)
│   │   ├── app.ts                # Express app setup with CORS & static upload route
│   │   ├── prisma.ts             # PrismaClient singleton
│   │   └── server.ts             # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── mobile/
    ├── src/
    │   ├── api/                  # client.ts (Axios with auto Bearer token injection)
    │   ├── components/           # SummaryCard, LoanItem, AddLoanModal, ReceiptViewerModal
    │   ├── context/              # AuthContext.tsx (AsyncStorage session)
    │   ├── screens/              # LoginScreen.tsx, DashboardScreen.tsx
    │   ├── types/                # TypeScript interface definitions
    │   └── config.ts             # Cross-platform API URL resolution (Web, Android, iOS)
    ├── App.tsx                   # Root navigator & auth provider
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally on port 5432)

---

### 1. Backend Setup

1. Open a terminal in `./backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `./backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres@127.0.0.1:5432/miniledger?schema=public"
   JWT_SECRET="miniledger_super_secret_jwt_key_2026"
   NODE_ENV=development
   ```
4. Push database schema:
   ```bash
   npx prisma db push
   ```
5. Run automated tests:
   ```bash
   npm test
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`.*

---

### 2. Mobile App Setup (React Native / Expo)

1. Open a new terminal in `./mobile`:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   - **In Web Browser**:
     ```bash
     npm run web
     ```
     Open `http://localhost:8081` in Chrome or any browser.
   - **On Android Emulator**:
     ```bash
     npm run android
     ```
   - **On Physical Device (Expo Go)**:
     ```bash
     npx expo start
     ```
     Scan the QR code using the Expo Go app on your phone.

---

## 📡 API Reference

### 🔐 Authentication

#### Request Mock OTP
- **`POST /api/auth/send-otp`**
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210"
  }
  ```
- **Console Log**:
  ```text
  ======================================================
  🔐 [MiniLedger AUTH] Mock OTP for: +919876543210
  ⭐ OTP Code: >>> 715022 <<<
  ⏳ Valid for 5 minutes
  ======================================================
  ```

#### Verify OTP & Login
- **`POST /api/auth/verify-otp`**
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210",
    "code": "715022"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "user": {
      "id": "uuid-string",
      "phoneNumber": "+919876543210"
    }
  }
  ```

---

### 💵 Loans

All loan endpoints require header: `Authorization: Bearer <token>`.

#### 1. Add Loan Entry
- **`POST /api/loans`** *(Supports `multipart/form-data` with optional receipt file)*
- **Fields**:
  - `friendName` (string, required)
  - `amount` (number, positive, required)
  - `dueDate` (ISO string or YYYY-MM-DD, required)
  - `notes` (string, optional)
  - `receipt` (image file, optional)

#### 2. Get Loan Summary
- **`GET /api/loans/summary`**
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalLent": 5000,
      "totalRepaid": 2000,
      "overdueAmount": 1500,
      "activeAmount": 3000,
      "stats": {
        "totalCount": 4,
        "repaidCount": 1,
        "overdueCount": 1,
        "activeCount": 3
      }
    }
  }
  ```

#### 3. List Loans
- **`GET /api/loans?status=all|active|overdue|repaid`**
- Returns array of loan objects including computed `isOverdue` boolean.

#### 4. Mark as Repaid
- **`PATCH /api/loans/:id/repay`**
- **Request Body**: `{"isRepaid": true}` (or `false` to unmark)

#### 5. Delete Loan
- **`DELETE /api/loans/:id`**

---

## 🧪 Testing Results

Run the test suite from the backend directory:
```bash
npm test
```
Result:
```text
PASS src/__tests__/api.test.ts
  MiniLedger Backend API Integration Tests
    1. Health Check
      √ GET /api/health should return ok
    2. Authentication Flow (Mock OTP)
      √ POST /api/auth/send-otp should fail with invalid phone
      √ POST /api/auth/send-otp should succeed and log mock OTP
      √ POST /api/auth/verify-otp should fail with wrong OTP
      √ POST /api/auth/verify-otp should succeed with correct OTP and issue JWT
    3. Loan Entry Management & Validation
      √ POST /api/loans should reject unauthenticated request
      √ POST /api/loans should reject negative or zero amount
      √ POST /api/loans should create an active loan (due in future)
      √ POST /api/loans should create an overdue loan (due in past)
      √ GET /api/loans should list all created loans with overdue flag
    4. Summary Endpoint Calculation
      √ GET /api/loans/summary should accurately calculate totals and overdue amount
    5. Mark as Repaid & Recalculate Summary
      √ PATCH /api/loans/:id/repay should mark overdue loan as repaid
      √ GET /api/loans/summary should update totals after repayment

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```
