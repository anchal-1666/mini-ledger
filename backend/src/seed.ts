import { prisma } from './prisma';

async function seed() {
  console.log('🌱 Starting database seed for MiniLedger...');

  // Ensure default demo user exists
  const demoPhone = '+919876543210';
  let demoUser = await prisma.user.findUnique({
    where: { phoneNumber: demoPhone },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        phoneNumber: demoPhone,
        name: 'Demo User',
      },
    });
    console.log(`Created default user: ${demoUser.phoneNumber} (${demoUser.id})`);
  } else {
    console.log(`Found existing user: ${demoUser.phoneNumber} (${demoUser.id})`);
  }

  // Get all users in the DB to seed for all of them
  const allUsers = await prisma.user.findMany();
  const now = new Date();

  // Helper to offset days
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const sampleLoans = [
    // --- OVERDUE LOANS (Unrepaid, past due date) ---
    {
      friendName: 'Rahul Sharma',
      amount: 4500,
      dueDate: daysAgo(10),
      isRepaid: false,
      repaidAt: null,
      notes: 'Weekend road trip split expenses - promised to settle by Monday',
    },
    {
      friendName: 'Priya Patel',
      amount: 12000,
      dueDate: daysAgo(24),
      isRepaid: false,
      repaidAt: null,
      notes: 'Emergency laptop repair advance - pending salary clearance',
    },
    {
      friendName: 'Vikram Singh',
      amount: 2500,
      dueDate: daysAgo(4),
      isRepaid: false,
      repaidAt: null,
      notes: 'Team dinner bill split at Barbeque Nation',
    },

    // --- ACTIVE LOANS (Unrepaid, upcoming due date) ---
    {
      friendName: 'Amit Verma',
      amount: 8000,
      dueDate: daysAhead(7),
      isRepaid: false,
      repaidAt: null,
      notes: 'Advance for concert passes and event booking fees',
    },
    {
      friendName: 'Sneha Gupta',
      amount: 15000,
      dueDate: daysAhead(14),
      isRepaid: false,
      repaidAt: null,
      notes: 'Security deposit contribution for shared apartment rental',
    },
    {
      friendName: 'Rohan Mehta',
      amount: 3200,
      dueDate: daysAhead(21),
      isRepaid: false,
      repaidAt: null,
      notes: 'Shared Amazon electronics order for mechanical keyboard',
    },

    // --- REPAID LOANS ---
    {
      friendName: 'Ananya Roy',
      amount: 5000,
      dueDate: daysAgo(15),
      isRepaid: true,
      repaidAt: daysAgo(5),
      notes: 'Monthly grocery & apartment utilities bill - paid back via UPI',
    },
    {
      friendName: 'Kunal Deshmukh',
      amount: 10000,
      dueDate: daysAgo(30),
      isRepaid: true,
      repaidAt: daysAgo(12),
      notes: 'Flight ticket booking to Goa - settled in full with thanks!',
    },
    {
      friendName: 'Neha Kapoor',
      amount: 1800,
      dueDate: daysAgo(8),
      isRepaid: true,
      repaidAt: daysAgo(2),
      notes: 'IMAX movie tickets and snacks at PVR',
    },
  ];

  for (const user of allUsers) {
    console.log(`\nSeeding loans for user ${user.phoneNumber} (${user.id})...`);

    // Clean existing loans for this user to avoid duplicates if re-seeding
    const deleted = await prisma.loan.deleteMany({
      where: { userId: user.id },
    });
    console.log(`Cleared ${deleted.count} old loans for ${user.phoneNumber}.`);

    for (const loanData of sampleLoans) {
      const created = await prisma.loan.create({
        data: {
          userId: user.id,
          friendName: loanData.friendName,
          amount: loanData.amount,
          dueDate: loanData.dueDate,
          isRepaid: loanData.isRepaid,
          repaidAt: loanData.repaidAt,
          notes: loanData.notes,
        },
      });
      console.log(
        `  ✓ Added loan: ${created.friendName} | ₹${created.amount} | Due: ${created.dueDate.toISOString().split('T')[0]} | Repaid: ${created.isRepaid}`
      );
    }
  }

  console.log('\n✅ Database successfully seeded with Overdue, Active, and Repaid loans!');
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
