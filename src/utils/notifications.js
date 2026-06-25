export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission() {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function sendNotification(title, options = {}) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, {
      icon: '/ExpenseTracker/app-icon.jpeg',
      badge: '/ExpenseTracker/app-icon.jpeg',
      ...options,
    });
    return true;
  } catch {
    return false;
  }
}

export function getDueDateMs(dueDate, dueTime) {
  if (!dueDate) return null;
  return new Date(`${dueDate}T${dueTime || '23:59'}`).getTime();
}

export function formatDueBadge(dueDate, dueTime) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(`${dueDate}T${dueTime || '23:59'}`);
  const diff = due - now;
  const diffHours = diff / (1000 * 60 * 60);
  const diffDays = diff / (1000 * 60 * 60 * 24);

  if (diff < 0) return { label: 'Overdue', color: 'var(--danger)' };
  if (diffHours < 1) return { label: `${Math.max(1, Math.round(diff / 60000))}m`, color: 'var(--danger)' };
  if (diffHours < 24) {
    const h = due.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayH = h % 12 || 12;
    const m = String(due.getMinutes()).padStart(2, '0');
    return { label: m === '00' ? `${displayH}${ampm}` : `${displayH}:${m}${ampm}`, color: '#f59e0b' };
  }
  if (diffDays < 2) return { label: 'Tomorrow', color: '#f59e0b' };
  if (diffDays < 7) {
    return { label: due.toLocaleDateString('en-US', { weekday: 'short' }), color: 'var(--accent-text)' };
  }
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'var(--muted)' };
}
