import { useState, useRef, useEffect } from 'react';

interface Options {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

interface Point { x: number; y: number }

export function useDragTracking({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
}: Options) {
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Track current offset in a ref so the native touchmove handler can read it
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const startPosRef = useRef<Point | null>(null);
  const isDraggingRef = useRef(false);

  // Lock body scroll while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isDragging]);

  const getCoords = (e: React.TouchEvent | React.MouseEvent | TouchEvent): Point => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    const pos = getCoords(e);
    isDraggingRef.current = true;
    startPosRef.current = pos;
    offsetRef.current = { x: 0, y: 0 };
    setIsDragging(true);
    setStartPos(pos);
    setOffset({ x: 0, y: 0 });
  };

  const onMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !startPosRef.current) return;
    const cur = getCoords(e);
    const next = { x: cur.x - startPosRef.current.x, y: cur.y - startPosRef.current.y };
    offsetRef.current = next;
    setOffset(next);
  };

  const onEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    setStartPos(null);

    const { x, y } = offsetRef.current;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (absX > absY && absX > threshold) {
      if (x > 0 && onSwipeRight) onSwipeRight();
      else if (x < 0 && onSwipeLeft) onSwipeLeft();
    } else if (absY > absX && absY > threshold) {
      if (y > 0 && onSwipeDown) onSwipeDown();
      else if (y < 0 && onSwipeUp) onSwipeUp();
    }

    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
  };

  // Attach a non-passive touchmove listener to the card element so we can
  // call preventDefault() and block native page scroll while dragging.
  const cardRef = useRef<HTMLElement | null>(null);

  const setCardRef = (el: HTMLElement | null) => {
    if (cardRef.current) {
      cardRef.current.removeEventListener('touchmove', nativeTouchMove);
    }
    cardRef.current = el;
    if (el) {
      el.addEventListener('touchmove', nativeTouchMove, { passive: false });
    }
  };

  // Defined outside so the same reference is used for add/remove
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function nativeTouchMove(e: TouchEvent) {
    if (isDraggingRef.current) {
      e.preventDefault();
    }
  }

  const dragDir = (() => {
    if (!isDragging) return null;
    const ax = Math.abs(offset.x);
    const ay = Math.abs(offset.y);
    const MIN = 28;
    if (ax < MIN && ay < MIN) return null;
    if (ax > ay) return offset.x > 0 ? 'right' : 'left';
    return offset.y > 0 ? 'down' : 'up';
  })();

  return {
    handlers: {
      onTouchStart: onStart,
      onTouchMove: onMove,
      onTouchEnd: onEnd,
      onMouseDown: onStart,
      onMouseMove: onMove,
      onMouseUp: onEnd,
      onMouseLeave: onEnd,
    },
    offset,
    isDragging,
    dragDir,
    setCardRef,
  };
}
