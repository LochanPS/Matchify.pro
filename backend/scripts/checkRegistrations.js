import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.registration.findMany({
    select: {
      id: true,
      amountTotal: true,
      paymentStatus: true,
      status: true,
      user: { select: { name: true, email: true } },
      category: { select: { name: true, entryFee: true } }
    }
  });

  console.log('All Registrations:');
  console.log(JSON.stringify(registrations, null, 2));
  console.log('\nTotal registrations:', registrations.length);
  console.log('Total amount:', registrations.reduce((sum, r) => sum + (r.amountTotal || 0), 0));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
