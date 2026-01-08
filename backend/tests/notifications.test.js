import dotenv from 'dotenv';
import notificationService from '../src/services/notificationService.js';

dotenv.config();

async function testNotifications() {
  console.log('🧪 Testing Notification System...\n');
  console.log('='.repeat(60) + '\n');

  // Test user ID (replace with actual user ID from your database)
  const testUserId = 'test-user-id'; // CHANGE THIS!

  try {
    // Test 1: Create a test notification
    console.log('1️⃣  Creating test notification...');
    const notification = await notificationService.createNotification({
      userId: testUserId,
      type: 'REGISTRATION_CONFIRMED',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working!',
      data: { test: true, timestamp: new Date().toISOString() },
    });
    console.log('   ✅ Notification created:', notification.id);
    console.log('');

    // Test 2: Get user notifications
    console.log('2️⃣  Fetching user notifications...');
    const result = await notificationService.getUserNotifications(testUserId, {
      page: 1,
      limit: 10,
      unreadOnly: false,
    });
    console.log(`   ✅ Found ${result.notifications.length} notifications`);
    console.log(`   📊 Unread count: ${result.unreadCount}`);
    console.log('');

    // Test 3: Mark as read
    console.log('3️⃣  Marking notification as read...');
    await notificationService.markAsRead(notification.id, testUserId);
    console.log('   ✅ Notification marked as read');
    console.log('');

    // Test 4: Create bulk notifications
    console.log('4️⃣  Creating bulk notifications...');
    const bulkNotifications = [
      {
        userId: testUserId,
        type: 'PARTNER_INVITATION',
        title: 'Partner Invitation',
        message: 'John Doe invited you to play doubles',
        data: { tournamentName: 'Test Tournament' },
      },
      {
        userId: testUserId,
        type: 'DRAW_PUBLISHED',
        title: 'Draw Published',
        message: 'The draw for Men\'s Singles has been published',
        data: { categoryName: 'Men\'s Singles' },
      },
    ];
    const bulkResult = await notificationService.createBulkNotifications(bulkNotifications);
    console.log(`   ✅ Created ${bulkResult.count} notifications`);
    console.log('');

    // Test 5: Mark all as read
    console.log('5️⃣  Marking all notifications as read...');
    const markAllResult = await notificationService.markAllAsRead(testUserId);
    console.log(`   ✅ Marked ${markAllResult.count} notifications as read`);
    console.log('');

    // Test 6: Delete notification
    console.log('6️⃣  Deleting test notification...');
    await notificationService.deleteNotification(notification.id, testUserId);
    console.log('   ✅ Notification deleted');
    console.log('');

    // Test 7: Test helper methods
    console.log('7️⃣  Testing helper methods...');
    await notificationService.notifyRegistrationConfirmed(
      testUserId,
      'Bangalore Open 2025',
      ['Men\'s Singles', 'Men\'s Doubles']
    );
    console.log('   ✅ Registration confirmation sent');

    await notificationService.notifyPointsAwarded(
      testUserId,
      100,
      'Bangalore Open 2025',
      'Winner'
    );
    console.log('   ✅ Points awarded notification sent');
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ All notification tests passed!\n');
    console.log('📊 Final Stats:');
    const finalResult = await notificationService.getUserNotifications(testUserId, {
      page: 1,
      limit: 100,
    });
    console.log(`   Total notifications: ${finalResult.pagination.total}`);
    console.log(`   Unread: ${finalResult.unreadCount}`);
    console.log(`   Read: ${finalResult.pagination.total - finalResult.unreadCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run tests
testNotifications();
