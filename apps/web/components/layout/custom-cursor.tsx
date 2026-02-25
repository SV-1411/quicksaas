'use client';

import { useEffect, useRef, useState } from 'react';

type CursorState = 'default' | 'hover' | 'click';

export function CustomCursor() {
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }

      if (followerRef.current) {
        followerRef.current.style.left = `${e.clientX}px`;
        followerRef.current.style.top = `${e.clientY}px`;
      }

      if (trailRef.current) {
        trailRef.current.style.left = `${e.clientX}px`;
        trailRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseDown = () => setCursorState('click');
    const handleMouseUp = () => setCursorState('default');

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, input, textarea, select, [role="button"], .interactive, .magnetic')) {
        setCursorState('hover');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, input, textarea, select, [role="button"], .interactive, .magnetic')) {
        setCursorState('default');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className={`cursor ${cursorState}`} />
      <div ref={followerRef} className={`cursor-follower ${cursorState}`} />
      <div ref={trailRef} className={`cursor-trail ${cursorState}`} />
    </>
  );
}
