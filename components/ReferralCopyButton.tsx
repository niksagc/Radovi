'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

export default function ReferralCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setTimeout(() => setCanShare(true), 0);
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'StudyWorks preporuka',
        text: `Iskoristi moj kod ${code} za 5€ popusta na prvu narudžbu na StudyWorks!`,
        url: window.location.origin,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center space-x-2 bg-white text-indigo-600 px-4 py-3 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors font-medium"
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        <span>{copied ? 'Kopirano!' : 'Kopiraj'}</span>
      </button>

      {canShare && (
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Share2 className="w-5 h-5" />
          <span>Podijeli</span>
        </button>
      )}
    </div>
  );
}
