import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Notification = {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: 'info' | 'error' | 'success' | 'warning'
}

interface NotificationStore {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notif) => set((state) => {
        // Evitar spam da mesma mensagem
        if (state.notifications.length > 0 && 
            state.notifications[0].title === notif.title && 
            !state.notifications[0].read) {
          return state;
        }
        return {
          notifications: [{
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            read: false
          }, ...state.notifications]
        }
      }),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearAll: () => set({ notifications: [] })
    }),
    { name: 'notification-storage' }
  )
)
