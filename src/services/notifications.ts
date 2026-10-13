import pb from '@/lib/api/client'
import { Notification, ActivityLog } from '@/types/helpdesk'

export const notificationService = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await pb.collection('notifications').getFullList<Notification>({
      filter: `user = "${userId}"`,
      sort: '-created',
      expand: 'ticket,preventiva',
    })
  },

  async markAsRead(id: string): Promise<Notification> {
    return await pb.collection('notifications').update<Notification>(id, {
      read: true,
    })
  },

  async markAllAsRead(userId: string): Promise<void> {
    const unread = await pb.collection('notifications').getFullList<Notification>({
      filter: `user = "${userId}" && read = false`,
    })
    for (const notif of unread) {
      await pb.collection('notifications').update(notif.id, { read: true })
    }
  },
}

export const activityLogService = {
  async getAll(limit = 100): Promise<ActivityLog[]> {
    return await pb.collection('activity_logs').getFullList<ActivityLog>({
      sort: '-created',
      limit,
      expand: 'user',
    })
  },
}
