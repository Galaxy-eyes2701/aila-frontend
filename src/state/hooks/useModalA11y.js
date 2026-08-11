import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Gom các yêu cầu accessibility của modal/dialog (§7.1):
 * focus trap, Esc để đóng, trả focus về phần tử đã kích hoạt khi đóng, khóa scroll nền.
 *
 * @param {() => void} onClose      gọi khi nhấn Esc
 * @param {React.RefObject} initialFocusRef  phần tử nhận focus đầu tiên (mặc định: phần tử focus được đầu tiên)
 * @returns ref gắn vào container của modal
 */
export default function useModalA11y(onClose, initialFocusRef) {
  const containerRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    const opener = document.activeElement;

    const getFocusable = () =>
      Array.from(container?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    (initialFocusRef?.current ?? getFocusable()[0] ?? container)?.focus?.();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) {
        event.preventDefault();
        container?.focus?.();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !container?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
    // Chạy đúng một lần theo vòng đời modal — onClose đã được giữ qua ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return containerRef;
}
