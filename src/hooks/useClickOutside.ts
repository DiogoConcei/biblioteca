import { RefObject, useEffect, useRef } from 'react';

export default function useClickOutside<T extends HTMLElement>(
  onOutsideClick: () => void,
  enabled = true,
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const outsideClickRef = useRef(onOutsideClick);

  useEffect(() => {
    outsideClickRef.current = onOutsideClick;
  }, [onOutsideClick]);

  useEffect(() => {
    if (!enabled) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!elementRef.current || !(target instanceof Node)) return;
      if (elementRef.current.contains(target)) return;

      outsideClickRef.current();
    };

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, [enabled]);

  return elementRef;
}
