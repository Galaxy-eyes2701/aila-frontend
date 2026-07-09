import { useEffect, useRef, useState } from "react";

/**
 * Đếm ngược tới `deadlineAt` (ISO UTC, server-authoritative).
 * Trả về `remainingMs`; gọi `onExpire` đúng 1 lần khi về 0.
 */
export default function useCountdown(deadlineAt, onExpire) {
  const target = deadlineAt ? new Date(deadlineAt).getTime() : null;

  const [remainingMs, setRemainingMs] = useState(() =>
    target ? Math.max(0, target - Date.now()) : 0
  );

  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!target) return undefined;
    firedRef.current = false;

    const tick = () => {
      const remaining = Math.max(0, target - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return remainingMs;
}
