'use client';

import { useEffect, useState } from 'react';
import { getReadTimestamps } from '@/lib/chat-utils';

export default function UnreadBadge({ 
  orderId, 
  latestMessageAt, 
  latestMessageSenderId, 
  currentUserId 
}: { 
  orderId: string, 
  latestMessageAt?: string, 
  latestMessageSenderId?: string, 
  currentUserId: string 
}) {
  const [isUnread, setIsUnread] = useState(false);

  useEffect(() => {
    const checkUnread = () => {
      if (!latestMessageAt || !latestMessageSenderId) {
        setIsUnread(false);
        return;
      }

      // If I sent the last message, it's not unread for me
      if (latestMessageSenderId === currentUserId) {
        setIsUnread(false);
        return;
      }

      const timestamps = getReadTimestamps();
      const lastReadStr = timestamps[orderId];
      
      if (!lastReadStr) {
        setIsUnread(true);
      } else {
        const lastRead = new Date(lastReadStr).getTime();
        const messageTime = new Date(latestMessageAt).getTime();
        setIsUnread(messageTime > lastRead);
      }
    };

    checkUnread();

    window.addEventListener('chat_read_updated', checkUnread);
    return () => {
      window.removeEventListener('chat_read_updated', checkUnread);
    };
  }, [orderId, latestMessageAt, latestMessageSenderId, currentUserId]);

  if (!isUnread) return null;

  return (
    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
      Nova poruka
    </span>
  );
}
