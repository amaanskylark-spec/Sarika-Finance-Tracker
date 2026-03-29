'use client';

import { useApp } from '@/hooks/use-app';
import React, { useState, useRef } from 'react';

export function Logo() {
  const { setAdminAuthModalOpen } = useApp();
  const [clickCount, setClickCount] = useState(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    clickTimeout.current = setTimeout(() => {
      setClickCount(0);
    }, 2000); // Reset after 2 seconds

    if (clickCount + 1 === 4) {
      setAdminAuthModalOpen(true);
      setClickCount(0);
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    }
  };

  return (
    <div
      className="text-3xl font-bold font-headline text-primary cursor-pointer select-none"
      onClick={handleClick}
    >
      Sarkia
    </div>
  );
}
