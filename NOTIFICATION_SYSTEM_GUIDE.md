# Notification System Guide

## Overview
The notification system provides real-time, in-portal notifications for admins, sales reps, and clients. Notifications appear in a dropdown bell icon and automatically update using Firestore real-time listeners.

---

## Architecture

### Core Components

1. **notifications-system.js** - Core notification functions
2. **Admin Dashboard UI** - Bell icon with dropdown in [admin.html](admin.html)
3. **Firestore Collection** - `notifications` collection stores all notifications
4. **Security Rules** - [firestore.rules](firestore.rules) lines 122-146

---

## Notification Types

### 1. QUOTE_SUBMITTED
**Trigger:** When client submits website discovery form
**Recipient:** Admin
**Location:** [website-quote-functions.js](website-quote-functions.js):723-739
**Message:** `New website quote from {businessName}`
**Action:** Links to Website Quotes tab

### 2. CLIENT_STEP_COMPLETE
**Trigger:** When client completes onboarding step
**Recipient:** Admin
**Location:** [client-functions.js](client-functions.js):274-297
**Message:** `{clientName} completed Step {stepNumber}`
**Action:** Links to Clients tab

### 3. DEAL_ASSIGNED
**Trigger:** When deal is assigned to sales rep
**Recipient:** Sales Rep
**Location:** [admin.html](admin.html):2756-2771
**Message:** `New deal assigned: {companyName}`
**Action:** Links to sales dashboard

### 4. DEAL_STAGE_CHANGE
**Trigger:** When deal moves to new stage
**Recipient:** Assigned Sales Rep
**Location:** [admin.html](admin.html):2774-2789
**Message:** `{companyName} moved to {newStage}`
**Action:** Links to sales dashboard

### 5. MESSAGE_RECEIVED
**Trigger:** When client sends message
**Recipient:** Admin
**Location:** [client-functions.js](client-functions.js):808-823
**Message:** `{clientName} sent you a message`
**Action:** Links to Clients tab messages

### 6. MESSAGE_REPLY
**Trigger:** When admin replies to client
**Recipient:** Client
**Location:** [admin.html](admin.html):3098-3112
**Message:** `Admin replied to your message`
**Action:** Links to client portal messages

---

## Core Functions

### createNotification(params)
Creates a new notification in Firestore.

**Parameters:**
```javascript
{
  type: string,           // Notification type (see above)
  recipientId: string,    // User ID or "admin"
  recipientType: string,  // "admin" | "sales-rep" | "client"
  message: string,        // Display message
  actionUrl: string,      // URL to navigate on click
  relatedId: string,      // Related entity ID (optional)
  metadata: object        // Additional context (optional)
}
```

**Usage Example:**
```javascript
await window.createNotification({
  type: 'QUOTE_SUBMITTED',
  recipientId: 'admin',
  recipientType: 'admin',
  message: 'New website quote from ABC Corp',
  actionUrl: 'admin.html?tab=website-quotes',
  relatedId: quoteId,
  metadata: {
    businessName: 'ABC Corp',
    budgetRange: '5k-10k'
  }
});
```

### listenForNotifications(recipientId, recipientType, callback)
Real-time listener for notifications.

**Parameters:**
- `recipientId`: User ID or "admin"
- `recipientType`: "admin" | "sales-rep" | "client"
- `callback`: Function called with notification array

**Returns:** Unsubscribe function

**Usage Example:**
```javascript
const unsubscribe = window.listenForNotifications('admin', 'admin', (notifications) => {
  console.log('Received notifications:', notifications);
  updateNotificationUI(notifications);
});

// Later: unsubscribe() to stop listening
```

### getUnreadNotificationCount(recipientId, recipientType)
Get count of unread notifications.

**Returns:** Promise<number>

**Usage Example:**
```javascript
const unreadCount = await window.getUnreadNotificationCount('admin', 'admin');
console.log(`You have ${unreadCount} unread notifications`);
```

### markNotificationRead(notificationId)
Mark single notification as read.

**Usage Example:**
```javascript
await window.markNotificationRead(notificationId);
```

### markAllNotificationsRead(recipientId, recipientType)
Mark all notifications as read for recipient.

**Usage Example:**
```javascript
await window.markAllNotificationsRead('admin', 'admin');
```

### renderNotification(notification)
Generate HTML for notification item.

**Returns:** HTML string

**Usage Example:**
```javascript
const html = window.renderNotification(notification);
document.getElementById('notificationsList').innerHTML += html;
```

### handleNotificationClick(notificationId, actionUrl)
Handle click on notification (mark as read and navigate).

**Usage Example:**
```javascript
<div onclick="handleNotificationClick('${notification.id}', '${notification.actionUrl}')">
  ${notification.message}
</div>
```

---

## UI Components

### Admin Dashboard Bell Icon
**Location:** [admin.html](admin.html):712-736

**Features:**
- Bell icon (🔔) in header
- Red badge showing unread count
- Dropdown panel with notification list
- "Mark All Read" button
- Empty state message
- Auto-closes when clicking outside

**Functions:**
- `toggleNotifications()` - Show/hide dropdown
- `initializeNotifications()` - Start real-time listener
- `updateNotificationsBadge(count)` - Update red badge
- `renderNotificationsList(notifications)` - Display list
- `markAllNotificationsRead()` - Mark all as read

---

## Database Structure

### Collection: `notifications`

**Document Fields:**
```javascript
{
  type: "QUOTE_SUBMITTED",
  recipientId: "admin",
  recipientType: "admin",
  message: "New website quote from ABC Corp",
  actionUrl: "admin.html?tab=website-quotes",
  relatedId: "WQ_1234567890",
  metadata: {
    businessName: "ABC Corp",
    budgetRange: "5k-10k",
    dealId: "abc123"
  },
  read: false,
  createdAt: Timestamp(2025-10-08 12:00:00),
  readAt: null
}
```

**Required Indexes:**
```
recipientId ASC, recipientType ASC, createdAt DESC
recipientId ASC, recipientType ASC, read ASC
```

**Security Rules:**
- Admins: Read all admin notifications
- Sales Reps: Read only their own notifications
- Clients: Read only their own notifications
- All: Can create notifications (system events)
- Recipients: Can update to mark as read
- Admins only: Can delete notifications

---

## Integration Points

### Files Modified

1. **[admin.html](admin.html)**
   - Added notification bell UI (lines 712-736)
   - Added notification functions (lines 4012-4093)
   - Added deal assignment notifications (lines 2756-2771)
   - Added deal stage change notifications (lines 2774-2789)
   - Added message reply notifications (lines 3098-3112)

2. **[website-quote-functions.js](website-quote-functions.js)**
   - Added quote submission notification (lines 723-739)

3. **[client-functions.js](client-functions.js)**
   - Added step completion notification (lines 274-297)
   - Added client message notification (lines 808-823)

4. **[index-contract.html](index-contract.html)**
   - Added notifications-system.js script (line 726)

5. **[index-m2m.html](index-m2m.html)**
   - Added notifications-system.js script (line 589)

6. **[index-website-quote.html](index-website-quote.html)**
   - Added notifications-system.js script (line 1859)

7. **[firestore.rules](firestore.rules)**
   - Added notifications security rules (lines 122-146)

8. **[DATA_MODEL.md](DATA_MODEL.md)**
   - Added notifications collection documentation (lines 275-325)

---

## How It Works

### Flow Example: Website Quote Submission

1. **Client Action:**
   - Client fills out website discovery form
   - Clicks "Submit Form"

2. **System Processing:**
   - `showCompletionScreen()` runs in [website-quote-functions.js](website-quote-functions.js)
   - Updates quote status to "completed"
   - Creates CRM deal at "Lead" stage
   - **Creates notification** using `window.createNotification()`

3. **Notification Created:**
   ```javascript
   {
     type: 'QUOTE_SUBMITTED',
     recipientId: 'admin',
     recipientType: 'admin',
     message: 'New website quote from ABC Corp',
     actionUrl: 'admin.html?tab=website-quotes',
     relatedId: quoteId,
     read: false,
     createdAt: now
   }
   ```

4. **Admin Dashboard:**
   - Real-time listener detects new notification
   - Updates bell badge to show "1"
   - Adds notification to dropdown list
   - Notification appears with icon: 📝

5. **Admin Interaction:**
   - Admin clicks notification bell → sees dropdown
   - Clicks notification → marks as read → navigates to Website Quotes tab
   - OR clicks "Mark All Read" → all marked as read

---

## Testing Checklist

### Admin Notifications
- [ ] Submit website quote → Admin receives notification
- [ ] Client completes Step 1 → Admin receives notification
- [ ] Client sends message → Admin receives notification
- [ ] Notification bell shows correct unread count
- [ ] Click notification → marks as read and navigates
- [ ] Mark All Read → clears all notifications

### Sales Rep Notifications (Future)
- [ ] Deal assigned to rep → Rep receives notification
- [ ] Deal stage changes → Rep receives notification
- [ ] Rep dashboard shows notification bell
- [ ] Rep can mark notifications as read

### Client Notifications (Future)
- [ ] Admin replies to message → Client receives notification
- [ ] Client portal shows notification indicator
- [ ] Client can view and dismiss notifications

---

## Future Enhancements

### Short Term
1. Add notification bell to Sales Rep dashboard
2. Add notification indicator to client portals
3. Add email/SMS notifications for critical events
4. Add notification preferences (mute certain types)

### Long Term
1. Notification grouping (e.g., "5 new deals assigned")
2. Notification history archive (older than 30 days)
3. Push notifications (browser API)
4. Notification templates for customization
5. Notification analytics (delivery, read rates)

---

## Troubleshooting

### Notifications Not Appearing

**Check:**
1. Is `notifications-system.js` loaded? (Check browser console)
2. Is real-time listener running? (Check console for "✓ Listening for notifications...")
3. Are Firestore security rules deployed? (`firebase deploy --only firestore:rules`)
4. Are composite indexes created in Firestore console?

**Debug:**
```javascript
// Check if createNotification function exists
console.log(typeof window.createNotification); // Should be "function"

// Manually create test notification
await window.createNotification({
  type: 'MESSAGE_RECEIVED',
  recipientId: 'admin',
  recipientType: 'admin',
  message: 'Test notification',
  actionUrl: 'admin.html'
});
```

### Badge Count Wrong

**Check:**
1. Verify `getUnreadNotificationCount()` query
2. Check for duplicate listeners
3. Verify notifications are being marked as read

**Debug:**
```javascript
// Get unread count manually
const count = await window.getUnreadNotificationCount('admin', 'admin');
console.log('Unread count:', count);

// Query notifications directly
const snapshot = await db.collection('notifications')
  .where('recipientId', '==', 'admin')
  .where('recipientType', '==', 'admin')
  .where('read', '==', false)
  .get();
console.log('Unread notifications:', snapshot.size);
```

### Security Rules Error

**Error:** `Missing or insufficient permissions`

**Solution:**
1. Deploy security rules: `firebase deploy --only firestore:rules`
2. Verify user is authenticated (for admin/rep notifications)
3. Check recipientId matches current user

---

## Support

For issues or questions:
- **Email:** Nicolas@driveleadmedia.com
- **Phone:** (678) 650-6411

---

## Version History

**v1.0 - October 2025**
- Initial notification system implementation
- 6 notification types
- Real-time listeners
- Admin dashboard UI
- Firestore security rules
- Full documentation
