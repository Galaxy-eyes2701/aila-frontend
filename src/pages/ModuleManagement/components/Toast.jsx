import { useEffect } from "react";
import styles from "../ModuleManagement.module.css";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <i
        className={`fas ${
          toast.type === "success" ? "fa-check-circle" : "fa-circle-exclamation"
        }`}
      />
      <span>{toast.message}</span>
    </div>
  );
}
