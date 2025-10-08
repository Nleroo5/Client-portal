/**
 * Drive Lead Media - In-Portal Notification System
 *
 * Creates and manages notifications for admins, sales reps, and clients
 * without relying on email. All notifications shown in-portal.
 */

(function() {
    'use strict';

    // Notification types with icons and colors
    const NOTIFICATION_TYPES = {
        CLIENT_STEP_COMPLETE: {
            icon: '✅',
            color: '#10b981',
            title: 'Client Progress'
        },
        QUOTE_SUBMITTED: {
            icon: '📝',
            color: '#F2A922',
            title: 'New Website Quote'
        },
        DEAL_ASSIGNED: {
            icon: '👤',
            color: '#3b82f6',
            title: 'Deal Assigned'
        },
        DEAL_STAGE_CHANGE: {
            icon: '📊',
            color: '#8b5cf6',
            title: 'Deal Updated'
        },
        MESSAGE_RECEIVED: {
            icon: '💬',
            color: '#ec4899',
            title: 'New Message'
        },
        MESSAGE_REPLY: {
            icon: '💬',
            color: '#05908C',
            title: 'Admin Replied'
        }
    };

    /**
     * Create a notification in Firestore
     * @param {Object} params - Notification parameters
     */
    window.createNotification = async function(params) {
        const {
            type,           // NOTIFICATION_TYPES key
            recipientId,    // User/client ID
            recipientType,  // 'admin' | 'salesRep' | 'client'
            message,        // Notification message
            actionUrl,      // Optional: URL to navigate to
            relatedId,      // Optional: Related entity ID (dealId, quoteId, etc.)
            metadata        // Optional: Additional data
        } = params;

        if (!type || !recipientId || !recipientType || !message) {
            console.error('Missing required notification parameters');
            return null;
        }

        try {
            const notificationData = {
                type,
                recipientId,
                recipientType,
                message,
                actionUrl: actionUrl || null,
                relatedId: relatedId || null,
                metadata: metadata || {},
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection('notifications').add(notificationData);
            console.log(`✓ Notification created: ${docRef.id}`);
            return docRef.id;

        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    };

    /**
     * Get unread notification count for a user
     * @param {string} recipientId - User/client ID
     * @param {string} recipientType - 'admin' | 'salesRep' | 'client'
     * @returns {Promise<number>} Unread count
     */
    window.getUnreadNotificationCount = async function(recipientId, recipientType) {
        try {
            const snapshot = await db.collection('notifications')
                .where('recipientId', '==', recipientId)
                .where('recipientType', '==', recipientType)
                .where('read', '==', false)
                .get();

            return snapshot.size;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    };

    /**
     * Listen for new notifications in real-time
     * @param {string} recipientId - User/client ID
     * @param {string} recipientType - 'admin' | 'salesRep' | 'client'
     * @param {Function} callback - Called when notifications change
     * @returns {Function} Unsubscribe function
     */
    window.listenForNotifications = function(recipientId, recipientType, callback) {
        return db.collection('notifications')
            .where('recipientId', '==', recipientId)
            .where('recipientType', '==', recipientType)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(notifications);
            }, error => {
                console.error('Error listening for notifications:', error);
            });
    };

    /**
     * Mark notification(s) as read
     * @param {string|Array<string>} notificationIds - Single ID or array of IDs
     */
    window.markNotificationsRead = async function(notificationIds) {
        const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

        try {
            const batch = db.batch();
            ids.forEach(id => {
                const ref = db.collection('notifications').doc(id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
            console.log(`✓ Marked ${ids.length} notification(s) as read`);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    /**
     * Render notification UI element
     * @param {Object} notification - Notification data
     * @returns {string} HTML string
     */
    window.renderNotification = function(notification) {
        const config = NOTIFICATION_TYPES[notification.type] || {
            icon: '🔔',
            color: '#6b7280',
            title: 'Notification'
        };

        const timeAgo = getTimeAgo(notification.createdAt);
        const unreadClass = notification.read ? '' : 'notification-unread';
        const clickAction = notification.actionUrl
            ? `onclick="window.handleNotificationClick('${notification.id}', '${notification.actionUrl}')"`
            : '';

        return `
            <div class="notification-item ${unreadClass}" ${clickAction} style="
                background: ${notification.read ? '#f9fafb' : '#ffffff'};
                border-left: 4px solid ${config.color};
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                cursor: ${notification.actionUrl ? 'pointer' : 'default'};
                transition: all 0.2s ease;
                box-shadow: ${notification.read ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'};
            " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='${notification.read ? '#f9fafb' : '#ffffff'}'">
                <div style="display: flex; gap: 12px; align-items: start;">
                    <div style="font-size: 1.5rem; flex-shrink: 0;">${config.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #012E40; margin-bottom: 4px; font-size: 0.95rem;">
                            ${config.title}
                        </div>
                        <div style="color: #000000; font-size: 0.9rem; line-height: 1.5; margin-bottom: 6px;">
                            ${notification.message}
                        </div>
                        <div style="color: #6b7280; font-size: 0.8rem;">
                            ${timeAgo}
                        </div>
                    </div>
                    ${!notification.read ? `
                        <div style="width: 8px; height: 8px; background: ${config.color}; border-radius: 50%; flex-shrink: 0; margin-top: 6px;"></div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    /**
     * Handle notification click
     * @param {string} notificationId - Notification ID
     * @param {string} actionUrl - URL to navigate to
     */
    window.handleNotificationClick = async function(notificationId, actionUrl) {
        // Mark as read
        await window.markNotificationsRead(notificationId);

        // Navigate to action URL
        if (actionUrl && actionUrl !== 'null') {
            window.location.href = actionUrl;
        }
    };

    /**
     * Get human-readable time ago string
     * @param {firebase.firestore.Timestamp} timestamp - Firestore timestamp
     * @returns {string} Time ago string
     */
    function getTimeAgo(timestamp) {
        if (!timestamp || !timestamp.toDate) return 'Just now';

        const now = new Date();
        const notificationTime = timestamp.toDate();
        const diffMs = now - notificationTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return notificationTime.toLocaleDateString();
    }

    // Expose NOTIFICATION_TYPES for use in other scripts
    window.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

})();
