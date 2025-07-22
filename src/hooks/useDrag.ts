import { useState, useRef, useEffect } from "react";
import { useChapterReturn } from "../types/customHooks.interfaces";

export default function useDrag(chapter: useChapterReturn) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const elementRef = useRef<HTMLImageElement>(null);
  const prevPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevPosition.current.x;
      const deltaY = e.clientY - prevPosition.current.y;
      prevPosition.current = { x: e.clientX, y: e.clientY };
      setPosition((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setPosition({ x: 0, y: 0 });
    };

    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("mouseleave", handleMouseUp);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [chapter.isLoading, chapter.currentPage]);

  return { position, elementRef };
}
