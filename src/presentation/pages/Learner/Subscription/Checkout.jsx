import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import api from "@services/api";
import { resolveApiError } from "@services/api";
import { formatPrice, formatDuration } from "@services/subscriptionPlan";
import { createPayment } from "@services/subscriptionApi";
import styles from "./Checkout.module.css";

/* ── Countdown hook ── */
function useCountdown(expiredAt) {
  const [remaining, setRemaining] = useState(() => {
    if (!expiredAt) return 0;
    return Math.max(0, Math.floor((new Date(expiredAt) - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!expiredAt) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiredAt) - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick(); // tính ngay khi expiredAt thay đổi
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiredAt]);

  return remaining;
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ── Copy to clipboard ── */
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={copy}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
        background: copied ? "#dcfce7" : "var(--primary-light)",
        color: copied ? "#15803d" : "var(--primary)",
        border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
      }}
      title="Sao chép"
    >
      <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
      {copied ? "Đã sao chép" : (label || "Sao chép")}
    </button>
  );
}

/**
 * UC-19: Trang thanh toán gói đăng ký.
 * Route: /subscription-plans/:planId/checkout
 *
 * Flow:
 *  1. Load plan info
 *  2. POST /learner/payments → nhận QR + orderCode
 *  3. Learner quét QR (bên ngoài app)
 *  4. Polling GET /learner/subscriptions/current mỗi 5s để phát hiện thanh toán thành công
 *  5. Hiển thị kết quả
 */
export default function Checkout() {
  const { planId } = useParams();

  // ── Phases: loading | ready | success | expired | error ──
  const [phase,    setPhase]    = useState("loading");
  const [plan,     setPlan]     = useState(null);
  const [payment,  setPayment]  = useState(null);  // CreatePaymentResultDto
  const [error,    setError]    = useState("");
  const [creating, setCreating] = useState(false);

  const pollRef    = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const remaining = useCountdown(payment?.expiredAt);

  // ── 1. Load plan ──
  useEffect(() => {
    api.get(`/subscription-plans/${planId}`)
      .then(res => {
        if (!mountedRef.current) return;
        if (res.data.success) {
          setPlan(res.data.data);
          setPhase("ready");
        } else {
          setError(res.data.errorMessage || "Gói đăng ký không khả dụng.");
          setPhase("error");
        }
      })
      .catch(err => {
        if (!mountedRef.current) return;
        const { errorMessage } = resolveApiError(err);
        setError(errorMessage || "Không thể tải thông tin gói.");
        setPhase("error");
      });
  }, [planId]);

  // ── 3. Polling kiểm tra thanh toán ──
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getCurrentSubscription();
        if (!mountedRef.current) return;
        if (res.success && res.data?.hasActiveSubscription) {
          stopPolling();
          setPhase("success");
        }
      } catch { /* ignore */ }
    }, 5000);
  }, [stopPolling]);

  // ── 2. Tạo payment khi user xác nhận ──
  const handleCreatePayment = useCallback(async () => {
    setCreating(true);
    setError("");
    try {
      const res = await createPayment(planId);
      if (!mountedRef.current) return;
      if (res.success) {
        setPayment(res.data);
        setPhase("qr");
        startPolling();
      } else {
        const code = res.errorCode;
        if (code === "LOWER_TIER_NOT_ALLOWED") {
          setError("Không thể mua gói có cấp độ thấp hơn gói đang hoạt động.");
        } else if (code === "PLAN_NOT_AVAILABLE") {
          setError("Gói đăng ký này hiện không còn được bán.");
        } else {
          setError(res.errorMessage || "Không thể tạo giao dịch. Vui lòng thử lại.");
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  }, [planId, startPolling]);

  // Dừng polling khi unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // Phát hiện hết hạn QR.
  // Dùng ref để track đã từng có remaining > 0 (tránh trigger ngay khi countdown = 0 lúc init)
  const hadPositiveRemaining = useRef(false);
  useEffect(() => {
    if (remaining > 0) hadPositiveRemaining.current = true;
  }, [remaining]);

  useEffect(() => {
    if (phase === "qr" && remaining === 0 && hadPositiveRemaining.current) {
      stopPolling();
      setPhase("expired");
    }
  }, [remaining, phase, stopPolling]);

  /* ── Render phases ── */

  if (phase === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 32 }} />
            <p style={{ marginTop: 12 }}>Đang tải thông tin gói...</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to="/subscription-plans" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Quay lại danh sách gói
          </Link>
          <div className={styles.errorBanner}>
            <i className="fas fa-circle-exclamation" />
            <span>{error || "Gói đăng ký không khả dụng."}</span>
          </div>
          <div className={styles.btnRow}>
            <Link to="/subscription-plans" className={styles.btnPrimary}>
              <i className="fas fa-arrow-left" /> Chọn gói khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.orderCard}>
            <div className={styles.statusBlock}>
              <div className={`${styles.statusIcon} ${styles.statusIconSuccess}`}>
                <i className="fas fa-circle-check" />
              </div>
              <h2 className={styles.statusTitle}>Thanh toán thành công!</h2>
              <p className={styles.statusDesc}>
                Gói <strong>{plan?.name}</strong> đã được kích hoạt cho tài khoản của bạn.
              </p>
              <div className={styles.btnRow}>
                <Link to="/profile/subscription" className={styles.btnPrimary}>
                  <i className="fas fa-gem" /> Xem gói hiện tại
                </Link>
                <Link to="/profile/payment-history" className={styles.btnOutline}>
                  <i className="fas fa-receipt" /> Lịch sử thanh toán
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to="/subscription-plans" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Quay lại
          </Link>
          <div className={styles.orderCard}>
            <div className={styles.statusBlock}>
              <div className={`${styles.statusIcon} ${styles.statusIconError}`}>
                <i className="fas fa-clock" />
              </div>
              <h2 className={styles.statusTitle}>Giao dịch đã hết hạn</h2>
              <p className={styles.statusDesc}>
                QR code đã hết hiệu lực. Vui lòng tạo giao dịch mới để tiếp tục.
              </p>
              <div className={styles.btnRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => {
                    setPayment(null);
                    hadPositiveRemaining.current = false;
                    setPhase("ready");
                  }}
                >
                  <i className="fas fa-rotate-right" /> Tạo giao dịch mới
                </button>
                <Link to="/subscription-plans" className={styles.btnOutline}>
                  Chọn gói khác
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── phase: ready ── */
  if (phase === "ready") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to="/subscription-plans" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Quay lại danh sách gói
          </Link>

          <h1 className={styles.pageTitle}>
            <i className="fas fa-credit-card" /> Xác nhận thanh toán
          </h1>
          <p className={styles.pageSubtitle}>Kiểm tra thông tin trước khi tiến hành thanh toán.</p>

          {error && (
            <div className={styles.errorBanner}>
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          {/* Thông tin đơn hàng */}
          <div className={styles.orderCard}>
            <p className={styles.sectionTitle}>
              <i className="fas fa-receipt" /> Thông tin đơn hàng
            </p>
            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>Gói đăng ký</span>
              <span className={styles.orderValue}>{plan?.name}</span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>Thời hạn</span>
              <span className={styles.orderValue}>{formatDuration(plan?.durationInDays)}</span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>AI Token</span>
              <span className={styles.orderValue}>{plan?.aiTokenLimit?.toLocaleString("vi-VN")}</span>
            </div>
            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>Tổng thanh toán</span>
              <span className={`${styles.orderValue} ${styles.orderTotal}`}>
                {formatPrice(plan?.price)}
              </span>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button
              className={styles.btnPrimary}
              onClick={handleCreatePayment}
              disabled={creating}
            >
              {creating
                ? <><i className="fas fa-spinner fa-spin" /> Đang tạo giao dịch...</>
                : <><i className="fas fa-qrcode" /> Tạo mã QR thanh toán</>}
            </button>
            <Link to="/subscription-plans" className={styles.btnOutline}>Hủy</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── phase: qr ── */
  const timerCls =
    remaining > 120 ? styles.timerActive :
    remaining > 30  ? styles.timerWarn   : styles.timerExpired;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/subscription-plans" className={styles.backLink}>
          <i className="fas fa-arrow-left" /> Quay lại
        </Link>

        <h1 className={styles.pageTitle}>
          <i className="fas fa-qrcode" /> Quét mã thanh toán
        </h1>
        <p className={styles.pageSubtitle}>
          Mở ứng dụng ngân hàng, quét mã QR bên dưới để hoàn tất thanh toán.
        </p>

        {/* Timer */}
        <div className={`${styles.timerBar} ${timerCls}`}>
          <i className="fas fa-clock" />
          Mã hết hạn sau: <strong>{formatSeconds(remaining)}</strong>
        </div>

        {/* QR Card */}
        <div className={styles.qrCard}>
          <p className={styles.sectionTitle} style={{ justifyContent: "center" }}>
            <i className="fas fa-qrcode" /> Mã QR chuyển khoản
          </p>

          <div className={styles.qrWrapper}>
            <img
              src={payment?.qrCodeUrl}
              alt="QR code thanh toán"
              className={styles.qrImage}
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>

          <p className={styles.qrDesc}>
            Sử dụng ứng dụng ngân hàng hỗ trợ VietQR để quét mã thanh toán
          </p>

          {/* Transfer info */}
          <div className={styles.transferGrid}>
            <div className={styles.transferItem}>
              <div className={styles.transferLabel}>Ngân hàng</div>
              <div className={styles.transferValue}>{payment?.bankName}</div>
            </div>
            <div className={styles.transferItem}>
              <div className={styles.transferLabel}>Số tài khoản</div>
              <div className={styles.transferValue}>
                {payment?.bankAccountNumber}
                <CopyButton text={payment?.bankAccountNumber} />
              </div>
            </div>
            <div className={styles.transferItem}>
              <div className={styles.transferLabel}>Chủ tài khoản</div>
              <div className={styles.transferValue}>{payment?.bankAccountName}</div>
            </div>
            <div className={styles.transferItem}>
              <div className={styles.transferLabel}>Số tiền</div>
              <div className={`${styles.transferValue} ${styles.transferValueAccent}`}>
                {formatPrice(payment?.amount)}
              </div>
            </div>
            <div className={styles.transferItem} style={{ gridColumn: "1 / -1" }}>
              <div className={styles.transferLabel}>
                Nội dung chuyển khoản
                <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: 700 }}>*bắt buộc</span>
              </div>
              <div className={`${styles.transferValue} ${styles.transferValueAccent}`}
                style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span>{payment?.paymentContent}</span>
                <CopyButton text={payment?.paymentContent} label="Sao chép" />
              </div>
            </div>
          </div>

          <div className={styles.infoBanner} style={{ textAlign: "left" }}>
            <i className="fas fa-circle-info" />
            <span>
              Nhập <strong>đúng nội dung chuyển khoản</strong> để hệ thống tự động xác nhận.
              Sau khi chuyển khoản thành công, trang sẽ tự động cập nhật.
            </span>
          </div>

          <div className={styles.pollingNote}>
            <i className="fas fa-spinner fa-spin" />
            Đang chờ xác nhận thanh toán...
          </div>
        </div>

        {/* Summary */}
        <div className={styles.orderCard}>
          <p className={styles.sectionTitle}><i className="fas fa-receipt" /> Tóm tắt</p>
          <div className={styles.orderRow}>
            <span className={styles.orderLabel}>Gói</span>
            <span className={styles.orderValue}>{plan?.name}</span>
          </div>
          <div className={styles.orderRow}>
            <span className={styles.orderLabel}>Mã đơn hàng</span>
            <span className={styles.orderValue} style={{ fontFamily: "monospace", fontSize: 13 }}>
              {payment?.orderCode}
            </span>
          </div>
          <div className={styles.orderRow}>
            <span className={styles.orderLabel}>Tổng</span>
            <span className={`${styles.orderValue} ${styles.orderTotal}`}>
              {formatPrice(payment?.amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
