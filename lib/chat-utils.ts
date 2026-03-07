'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'studyworks_chat_read_timestamps';

export function getReadTimestamps(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function markOrderChatAsRead(orderId: string) {
  if (typeof window === 'undefined') return;
  try {
    const timestamps = getReadTimestamps();
    timestamps[orderId] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
    // Dispatch a custom event so other components can update
    window.dispatchEvent(new Event('chat_read_updated'));
  } catch (e) {
    console.error('Error saving read timestamp', e);
  }
}

export function useUnreadMessages(orders: any[], currentUserId: string) {
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const calculateUnread = () => {
      const timestamps = getReadTimestamps();
      const newUnreadMap: Record<string, boolean> = {};

      orders.forEach(order => {
        // Find the latest message in this order
        const messages = order.order_messages || [];
        if (messages.length === 0) {
          newUnreadMap[order.id] = false;
          return;
        }

        // Sort by created_at descending
        const sortedMessages = [...messages].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const latestMessage = sortedMessages[0];
        
        // If I sent the last message, it's not unread for me
        if (latestMessage.sender_id === currentUserId) {
          newUnreadMap[order.id] = false;
          return;
        }

        const lastReadStr = timestamps[order.id];
        if (!lastReadStr) {
          // Never read, and I didn't send it -> unread
          newUnreadMap[order.id] = true;
        } else {
          const lastRead = new Date(lastReadStr).getTime();
          const messageTime = new Date(latestMessage.created_at).getTime();
          newUnreadMap[order.id] = messageTime > lastRead;
        }
      });

      setUnreadMap(newUnreadMap);
    };

    calculateUnread();

    // Listen for updates
    window.addEventListener('chat_read_updated', calculateUnread);
    return () => {
      window.removeEventListener('chat_read_updated', calculateUnread);
    };
  }, [orders, currentUserId]);

  return unreadMap;
}
