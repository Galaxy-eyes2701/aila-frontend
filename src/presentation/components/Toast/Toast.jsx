import { useEffect, useRef } from 'react';
import styles from './Toast.module.css';

const ICONS = {
  success: 'fa-check-circle',
  error: 'fa-circle-exclamation',
  info: 'fa-circle-info',
};

/**
 * Toast dùng chung, hỗ trợ 3 mức: success | error | info.
 * `info` dành cho các tình huống "không ai làm sai" (ví dụ dữ liệu vừa bị người khác đổi)
 * — không hiển thị như lỗi đỏ.
 */
export default function Toast({ toast, onClose }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Đếm giờ theo nội dung toast — parent re-render không làm reset thời gian hiển thị.
  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current?.(), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const type = ICONS[toast.type] ? toast.type : 'success';
  const isError = type === 'error';

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <i className={`fas ${ICONS[type]}`} aria-hidden="true" />
      <span>{toast.message}</span>
    </div>
  );
}
