'use client';

import { BookOpen, PenTool } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'text';
  color?: 'indigo' | 'white' | 'zinc';
}

export default function Logo({ className = '', variant = 'full', color = 'indigo' }: LogoProps) {
  const colorClasses = {
    indigo: 'text-indigo-600',
    white: 'text-white',
    zinc: 'text-zinc-900',
  };

  const iconColorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    white: 'bg-white/10 text-white',
    zinc: 'bg-zinc-100 text-zinc-600',
  };

  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${color === 'white' ? 'border-white/20' : 'border-zinc-200'} ${className}`}>
        <div className="relative">
          <BookOpen size={20} className={colorClasses[color]} />
          <PenTool 
            size={12} 
            className={`absolute -top-1 -right-1 transform rotate-12 ${colorClasses[color]}`} 
          />
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`text-2xl font-bold tracking-tight ${colorClasses[color]} ${className}`}>
        StudyWorks
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${color === 'white' ? 'border-white/20' : 'border-zinc-200'}`}>
        <div className="relative">
          <BookOpen size={20} className={colorClasses[color]} />
          <PenTool 
            size={12} 
            className={`absolute -top-1 -right-1 transform rotate-12 ${colorClasses[color]}`} 
          />
        </div>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${colorClasses[color]}`}>
        StudyWorks
      </span>
    </div>
  );
}
