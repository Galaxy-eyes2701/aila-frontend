import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveApiError } from "../../../utils/api";
import { getExpertAiResourceUsage } from "./services/expertAiResourceApi";
import styles from "./ExpertAiResourceUsage.module.css";

function formatNumber(val) {
  if (val === null || val === undefined) return "0";
  return val.toLocaleString("vi-VN");
}

export default function ExpertAiResourceUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getExpertAiResourceUsage();
      if (res.success) {
        setData(res.data);
      } else {
        // AF-01 — Resource info unavailable
        setError(res.errorMessage || "Thông tin sử dụng tài nguyên AI tạm thời không khả dụng (AF-01).");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Thông tin sử dụng tài nguyên AI tạm thời không khả dụng (AF-01). Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const percentage = data?.usagePercentage ?? 0;
  const isExceeded = data?.isExceeded ?? false;
  const isNearLimit = data?.isNearLimit ?? false;

  let badgeClass = styles.statusNormal;
  let badgeIcon = "fa-circle-check";
  let badgeLabel = "Hạn mức bình thường";

  if (isExceeded) {
    badgeClass = styles.statusDanger;
    badgeIcon = "fa-circle-xmark";
    badgeLabel = "Đã hết hạn mức";
  } else if (isNearLimit) {
    badgeClass = styles.statusWarning;
    badgeIcon = "fa-triangle-exclamation";
    badgeLabel = "Sắp hết hạn mức";
  }

  let barClass = styles.barNormal;
  if (isExceeded) barClass = styles.barDanger;
  else if (isNearLimit) barClass = styles.barWarning;

  let calloutClass = styles.calloutNormal;
  if (isExceeded) calloutClass = styles.calloutDanger;
  else if (isNearLimit) calloutClass = styles.calloutWarning;

  return (
    <div className={styles.page}>
      {/* ── Hero Banner ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/expert">Trang chủ Chuyên gia</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <Link to="/expert/profile">Hồ sơ cá nhân</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span>Tài nguyên AI Token</span>
          </nav>

          <div className={styles.heroHeader}>
            <div className={styles.heroTitleGroup}>
              <h1>
                Quản lý <em>Tài nguyên AI Token</em>
              </h1>
              <p>
                Theo dõi định ngạch AI Token được cấp, lượng tiêu thụ và số dư còn lại của tài khoản
                Chuyên gia.
              </p>
            </div>

            {data && (
              <div className={`${styles.statusBadge} ${badgeClass}`}>
                <i className={`fas ${badgeIcon}`} aria-hidden="true" />
                <span>{badgeLabel}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Container ── */}
      <div className={styles.container}>
        {/* AF-01 Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <div className={styles.errorContent}>
              <strong>Tạm thời không truy xuất được dữ liệu (AF-01)</strong>
              <p>{error}</p>
            </div>
            <button type="button" className={styles.retryBtn} onClick={fetchUsage}>
              <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && <div className={styles.skeletonCard} />}

        {/* Main Content View */}
        {!loading && data && (
          <>
            <div className={styles.mainCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <div className={styles.tokenIcon}>
                    <i className="fas fa-bolt" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Hạn Mức AI Token Chuyên Gia</h2>
                    <p>Mã tài khoản: {data.accountId}</p>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className={styles.progressSection}>
                <div className={styles.progressLabelRow}>
                  <span>Tỷ lệ đã sử dụng: {percentage}%</span>
                  <span>
                    {formatNumber(data.consumedTokens)} / {formatNumber(data.allocatedTokens)} Token
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressBar} ${barClass}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>

              {/* 3 Metrics Cards Grid (BR-01) */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>
                    <i className="fas fa-shield-halved" /> Định Ngạch Được Cấp (BR-01)
                  </span>
                  <span className={styles.metricValue}>{formatNumber(data.allocatedTokens)}</span>
                  <span className={styles.metricSub}>AI Tokens</span>
                </div>

                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>
                    <i className="fas fa-fire-flame-curved" /> Đã Tiêu Thụ (BR-01)
                  </span>
                  <span className={styles.metricValue}>{formatNumber(data.consumedTokens)}</span>
                  <span className={styles.metricSub}>AI Tokens</span>
                </div>

                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>
                    <i className="fas fa-wallet" /> Số Dư Còn Lại (BR-01)
                  </span>
                  <span className={`${styles.metricValue} ${styles.metricValueRemaining}`}>
                    {formatNumber(data.remainingTokens)}
                  </span>
                  <span className={styles.metricSub}>AI Tokens khả dụng</span>
                </div>
              </div>

              {/* Status Alert Callout */}
              {data.statusMessage && (
                <div className={`${styles.alertCallout} ${calloutClass}`} role="status">
                  <i className={`fas ${isExceeded ? "fa-circle-exclamation" : isNearLimit ? "fa-triangle-exclamation" : "fa-circle-info"}`} />
                  <span>{data.statusMessage}</span>
                </div>
              )}
            </div>

            {/* Business Rules Info Box */}
            <div className={styles.infoBox}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-circle-info" aria-hidden="true" />
                Quy tắc sử dụng tài nguyên AI (Business Rules)
              </h3>
              <ul className={styles.infoList}>
                <li className={styles.infoItem}>
                  <div className={styles.infoItemIcon}>
                    <i className="fas fa-chart-pie" aria-hidden="true" />
                  </div>
                  <div className={styles.infoItemText}>
                    <h4>Hiển thị tài nguyên minh bạch (BR-01)</h4>
                    <p>
                      Hệ thống hiển thị chính xác định ngạch được cấp, lượng AI Token đã sử dụng và
                      số dư khả dụng của Chuyên gia.
                    </p>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <div className={styles.infoItemIcon}>
                    <i className="fas fa-sliders" aria-hidden="true" />
                  </div>
                  <div className={styles.infoItemText}>
                    <h4>Xác định định ngạch (BR-02)</h4>
                    <p>
                      Định ngạch được xác định từ cấu hình riêng của tài khoản Chuyên gia
                      (Account-specific configuration); nếu không có sẽ áp dụng chính sách toàn cục.
                    </p>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <div className={styles.infoItemIcon}>
                    <i className="fas fa-lock" aria-hidden="true" />
                  </div>
                  <div className={styles.infoItemText}>
                    <h4>Cấu hình bởi Quản trị viên (BR-03)</h4>
                    <p>
                      Tài nguyên AI Token dành cho Chuyên gia không tự động gia hạn. Định ngạch bổ sung
                      được cấp trực tiếp qua cấu hình của Admin.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
