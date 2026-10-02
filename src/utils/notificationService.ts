/**
 * Push Notification Service
 * Integrates with standard Web Notification API and provides in-app simulated Android banners
 */

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  timestamp: string;
}

type NotificationListener = (notification: InAppNotification) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'default';
    }
  }

  getPermissionState(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported' as NotificationPermission;
    }
    return Notification.permission;
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(title: string, body: string, icon: string = '⚡') {
    const item: InAppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      icon,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Emit to in-app Android notification banner listeners
    this.listeners.forEach((fn) => fn(item));

    // Try native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback handled in-app
      }
    }
  }
}

export const notificationService = new NotificationService();
