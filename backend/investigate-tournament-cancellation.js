import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function investigateTournamentCancellation() {
  try {
    console.log('🔍 Investigating tournament cancellation...');
    
    // Check all tournaments and their status history
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organizerId: true,
        totalRegistrations: true,
        organizer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`📊 Found ${tournaments.length} tournaments`);
    
    tournaments.forEach(t => {
      console.log(`\n🏆 Tournament: ${t.name}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Organizer: ${t.organizer.name}`);
      console.log(`   Registrations: ${t.totalRegistrations}`);
      console.log(`   Created: ${t.createdAt}`);
      console.log(`   Updated: ${t.updatedAt}`);
      
      if (t.status === 'cancelled') {
        console.log(`   ❌ CANCELLED TOURNAMENT FOUND!`);
      }
    });
    
    // Check for cancelled tournaments specifically
    const cancelledTournaments = tournaments.filter(t => t.status === 'cancelled');
    console.log(`\n❌ Cancelled tournaments: ${cancelledTournaments.length}`);
    
    if (cancelledTournaments.length > 0) {
      console.log('\n🔍 DETAILED CANCELLATION ANALYSIS:');
      
      for (const tournament of cancelledTournaments) {
        console.log(`\n📋 Tournament: ${tournament.name}`);
        console.log(`   ID: ${tournament.id}`);
        console.log(`   Organizer: ${tournament.organizer.name} (${tournament.organizer.email})`);
        console.log(`   Registrations at cancellation: ${tournament.totalRegistrations}`);
        console.log(`   Created: ${tournament.createdAt}`);
        console.log(`   Last updated: ${tournament.updatedAt}`);
        
        // Check registrations for this tournament
        const registrations = await prisma.registration.findMany({
          where: { tournamentId: tournament.id },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            amountTotal: true,
            createdAt: true,
            user: {
              select: { name: true, email: true }
            }
          }
        });
        
        console.log(`   📝 Total registrations: ${registrations.length}`);
        
        const statusCounts = registrations.reduce((acc, reg) => {
          acc[reg.status] = (acc[reg.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`   📊 Registration status breakdown:`, statusCounts);
        
        // Check payment verifications
        const paymentVerifications = await prisma.paymentVerification.findMany({
          where: { tournamentId: tournament.id },
          select: {
            status: true,
            amount: true,
            submittedAt: true
          }
        });
        
        const paymentStatusCounts = paymentVerifications.reduce((acc, pv) => {
          acc[pv.status] = (acc[pv.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`   💳 Payment verification status:`, paymentStatusCounts);
        
        // Calculate potential revenue loss
        const totalRevenueLoss = registrations.reduce((sum, reg) => sum + (reg.amountTotal || 0), 0);
        console.log(`   💰 Potential revenue loss: ₹${totalRevenueLoss}`);
      }
    }
    
    // Check audit logs for tournament status changes
    console.log('\n🔍 Checking audit logs for tournament status changes...');
    
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: 'tournament' } },
          { entityType: 'Tournament' },
          { details: { contains: 'cancelled' } },
          { details: { contains: 'status' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        admin: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`📋 Found ${auditLogs.length} relevant audit log entries`);
    
    auditLogs.forEach(log => {
      console.log(`\n📝 Audit Log Entry:`);
      console.log(`   Action: ${log.action}`);
      console.log(`   Entity: ${log.entityType} (${log.entityId})`);
      console.log(`   Admin: ${log.admin.name} (${log.admin.email})`);
      console.log(`   Details: ${log.details}`);
      console.log(`   Time: ${log.createdAt}`);
      console.log(`   IP: ${log.ipAddress}`);
    });
    
    // Recommendations to prevent future cancellations
    console.log('\n🛡️ RECOMMENDATIONS TO PREVENT FUTURE CANCELLATIONS:');
    console.log('1. Implement tournament status change approval workflow');
    console.log('2. Add confirmation dialogs for critical actions');
    console.log('3. Require reason for cancellation');
    console.log('4. Send notifications to all registered users before cancellation');
    console.log('5. Implement automatic refund processing');
    console.log('6. Add tournament status change audit trail');
    console.log('7. Restrict cancellation permissions to specific admin roles');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTournamentCancellation();