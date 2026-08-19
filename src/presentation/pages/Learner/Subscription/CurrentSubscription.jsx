import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveApiError } from "@services/api";
import { getCurrentSubscription } from "@services/subscriptionApi";
import styles from "./CurrentSubscription.module.css";

/* ── Helpers ── */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return iso; }
}

function statusConfig(status) {
  if (status === "Active")
    return { label: "Đang hoạt động", cls: styles.statusActive, icon: "fa-circle-check" };
  if (status === "Expired")
    return { label: "Đã hết hạn", cls: styles.statusExpired, icon: "fa-circle-xmark" };
  return { label: "Chưa có gói", cls: styles.statusNone, icon: "fa-circle" };
}

/**
 * UC-18: Xem thông tin gói đăng ký hiện tại.
 * Route: /profile/subscription
 */
export default function CurrentSubscription() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCurrentSubscription();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.errorMessage || "Không thể tải thông tin gói đăng ký.");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sub = data;
  const active = sub?.hasActiveSubscription;

  // Tính phần trăm thời gian còn lại
  let remainPct = 0;
  if (active && sub.activatedAt && sub.expiredAt) {
    const total = new Date(sub.expiredAt) - new Date(sub.activatedAt);
    const elapsed = Date.now() - new Date(sub.activatedAt).getTime();
    remainPct = Math.max(0, Math.min(100, Math.round((1 - elapsed / total) * 100)));
  }

  const { label: statusLabel, cls: statusCls, icon: statusIcon } =
    statusConfig(active ? "Active" : "None");

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <Link to="/profile">Hồ sơ cá nhân</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span>Gói đăng ký hiện tại</span>
          </nav>
          <h1 className={styles.heroTitle}>
            Gói <em>Đăng ký</em> của bạn
          </h1>
          <p className={styles.heroDesc}>
            Xem trạng thái, thời hạn và quyền lợi của gói đăng ký đang hoạt động.
          </p>
        </div>
      </section>

      <div className={styles.container} style={{ marginTop: 32 }}>
        {/* Error */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-circle-exclamation" aria-hidden="true" />
            <span>{error}</span>
            <button className={styles.retryBtn} onClick={fetchData}>
              <i className="fas fa-rotate-right" /> Thử lại
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className={styles.subCard}>
            <div className={styles.skeleton} style={{ height: 28, width: "40%", marginBottom: 24 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className={styles.skeleton} style={{ height: 72, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        )}

        {/* Data */}
        {!loading && !error && sub && (
          <>
            {active ? (
              <div className={styles.subCard}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.planNameRow}>
                    <h2 className={styles.planName}>{sub.subscriptionPlanName}</h2>
                    {sub.tierLevel && (
                      <span className={styles.tierBadge}>
                        <i className="fas fa-gem" /> Tier {sub.tierLevel}
                      </span>
                    )}
                    <span className={`${styles.statusBadge} ${statusCls}`}>
                      <i className={`fas ${statusIcon}`} aria-hidden="true" />
                      {statusLabel}
                    </span>
                  </div>

                  {/* Action buttons — UC-18 Step 4 */}
                  <div className={styles.actions}>
                    <Link to="/subscription-plans" className={styles.btnPrimary}>
                      <i className="fas fa-arrow-up-right-dots" />  Nâng cấp
                    </Link>
                    <Link to="/profile/subscription-usage" className={styles.btnOutline}>
                      <i className="fas fa-chart-pie" /> Xem tài nguyên
                    </Link>
                  </div>
                </div>

                {/* Info Grid — BR-02 */}
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Ngày kích hoạt</div>
                    <div className={styles.infoValue}>{formatDate(sub.activatedAt)}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Ngày hết hạn</div>
                    <div className={styles.infoValue}>{formatDate(sub.expiredAt)}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Còn lại</div>
                    <div className={`${styles.infoValue} ${sub.remainingDays <= 7 ? styles.infoValueWarn : styles.infoValueAccent
                      }`}>
                      {sub.remainingDays} ngày
                    </div>
                  </div>
                </div>

                {/* Progress bar thời gian còn lại */}
                <div className={styles.remainingBlock}>
                  <div className={styles.remainingLabel}>
                    <span>Thời hạn sử dụng</span>
                    <span>{remainPct}% còn lại</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${remainPct < 20 ? styles.progressFillLow : ""}`}
                      style={{ width: `${remainPct}%` }}
                      role="progressbar"
                      aria-valuenow={remainPct}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                </div>

                {/* Link xem lịch sử */}
                <Link
                  to="/profile/payment-history"
                  style={{ fontSize: 13, color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <i className="fas fa-receipt" /> Xem lịch sử thanh toán
                </Link>
              </div>
            ) : (
              /* AF-01 — Không có gói active */
              <div className={styles.emptyCard}>
                <div className={styles.emptyIcon}>
                  <i className="fas fa-box-open" aria-hidden="true" />
                </div>
                <h2 className={styles.emptyTitle}>Bạn chưa có gói đăng ký</h2>
                <p className={styles.emptyDesc}>
                  Đăng ký gói để mở khoá AI Token, lượt luyện tập và đánh giá chuyên gia.
                </p>
                <div className={styles.actions} style={{ justifyContent: "center" }}>
                  <Link to="/subscription-plans" className={styles.btnPrimary}>
                    <i className="fas fa-gem" /> Khám phá các gói
                  </Link>
                  <Link to="/profile/payment-history" className={styles.btnOutline}>
                    <i className="fas fa-receipt" /> Lịch sử thanh toán
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
