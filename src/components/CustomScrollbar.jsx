import { useCallback, useEffect, useRef, useState } from "react";

const MIN_THUMB_HEIGHT = 32;
const TRACK_WIDTH = 16;
const THUMB_WIDTH = 9;

// Scrollbar da página flutuante e sem track/setinhas — o Windows/Edge (Fluent
// scrollbars) ignora ::-webkit-scrollbar-button via CSS, então a única forma
// de remover as setinhas de verdade é esconder a nativa e desenhar a nossa.
export default function CustomScrollbar() {
  const [thumb, setThumb] = useState({ top: 0, height: 0, visible: false });
  const draggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const measure = useCallback(() => {
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight;
    const clientHeight = doc.clientHeight;

    if (scrollHeight <= clientHeight + 1) {
      setThumb((t) => (t.visible ? { top: 0, height: 0, visible: false } : t));
      return;
    }

    const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, MIN_THUMB_HEIGHT);
    const maxThumbTop = clientHeight - thumbHeight;
    const scrollableDist = scrollHeight - clientHeight;
    const top = (window.scrollY / scrollableDist) * maxThumbTop;

    setThumb({ top, height: thumbHeight, visible: true });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [measure]);

  const handlePointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight;
    const clientHeight = doc.clientHeight;
    const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, MIN_THUMB_HEIGHT);
    const maxThumbTop = clientHeight - thumbHeight;
    const scrollableDist = scrollHeight - clientHeight;

    const deltaY = e.clientY - dragStartYRef.current;
    const deltaScroll = maxThumbTop > 0 ? (deltaY / maxThumbTop) * scrollableDist : 0;
    window.scrollTo({ top: dragStartScrollRef.current + deltaScroll });
  }, []);

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
  }, [handlePointerMove]);

  const startDragging = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartScrollRef.current = window.scrollY;
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
  }, [handlePointerMove, stopDragging]);

  if (!thumb.visible) return null;

  return (
    <div
      className="hidden md:block fixed top-0 right-0 h-screen z-[200] pointer-events-none"
      style={{ width: TRACK_WIDTH }}
    >
      <div
        onPointerDown={startDragging}
        className="absolute rounded-full bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-300 transition-colors pointer-events-auto"
        style={{
          top: thumb.top,
          height: thumb.height,
          width: THUMB_WIDTH,
          right: 0,
        }}
      />
    </div>
  );
}
