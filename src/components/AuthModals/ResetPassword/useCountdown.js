import { useEffect, useRef, useState } from 'react';

/**
 * Đếm ngược tới mốc `deadline` (epoch ms) — truyền `null` để tắt đồng hồ.
 *
 * Mỗi tick tính lại hiệu số với `Date.now()` thay vì cộng dồn `-1`, để tab bị
 * trình duyệt throttle quay lại vẫn hiển thị đúng. `onExpire` gọi đúng 1 lần.
 */
const remainingFrom = (deadline) =>
  deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0;

export default function useCountdown(deadline, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(() => remainingFrom(deadline));

  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!deadline) return undefined;
    firedRef.current = false;

    const tick = () => {
      const left = remainingFrom(deadline);
      setSecondsLeft(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  // Không có deadline thì đồng hồ tắt — không cần đụng tới state.
  return deadline ? secondsLeft : 0;
}

/** 272 -> "04:32". Đồng hồ phải có text đọc được, không chỉ vòng tròn tiến trình. */
export function formatMmSs(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
