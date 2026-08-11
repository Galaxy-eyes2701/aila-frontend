import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContent}`}>
        <span className={styles.brand}>Bình Dân Học AI</span>
        <span className={styles.copy}>© 2026 · Nền tảng học AI cho mọi người</span>
      </div>
    </footer>
  );
}
