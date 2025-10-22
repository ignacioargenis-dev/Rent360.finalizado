/**
 * Helper para obtener el contador de mensajes no leídos
 * Reutilizable en todos los dashboards
 */
export async function getUnreadMessagesCount(): Promise<number> {
  try {
    const response = await fetch('/api/messages/unread-count');
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.unreadCount;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error loading unread messages count:', error);
    return 0;
  }
}
