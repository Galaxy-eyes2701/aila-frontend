import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { resolveApiError } from "../../../utils/api";
import { getSubscriptionResourceUsage } from "./services/subscriptionUsageApi";
import styles from "./SubscriptionResourceUsage.module.css";

/* ── Helpers ── */
function formatNumber(val) {
  if (val === null || val === undefined) return "0";
  return val.toLocaleString("vi-VN");
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const RESOURCE_ICONS = {
  AiToken: { icon: "fa-bolt", styleClass: styles.iconAiToken },
  AiPracticeScenario: { icon: "fa-comments", styleClass: styles.iconAiPractice },
  ExpertEvaluationRequest: { icon: "fa-user-check", styleClass: styles.iconExpertEval },
};

function ResourceCard({ resource }) {
  const { resourceType, resourceName, unit, allocatedQuota, usedQuota, remainingQuota } = resource;

  const iconInfo = RESOURCE_ICONS[resourceType] || {
    icon: "fa-cubes",
    styleClass: styles.iconAiToken,
  };

  const percentage = allocatedQuota > 0 
    ? Math.min(100, Math.round((usedQuota / allocatedQuota) * 100)) 
    : 0;

  let barClass = styles.barNormal;
  if (percentage >= 85) {
    barClass = styles.barDanger;
  } else if (percentage >= 65) {
    barClass = styles.barWarning;
  }

  return (
    <article className={styles.resourceCard}>
      <div className={styles.cardHeader}>
        <div className={`${styles.iconWrapper} ${iconInfo.styleClass}`}>
          <i className={`fas ${iconInfo.icon}`} aria-hidden="true" />
        </div>
        <div className={styles.cardTitleGroup}>
          <h3>{resourceName}</h3>
          <span className={styles.unitPill}>{unit}</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabelRow}>
          <span>Đã dùng: {percentage}%</span>
          <span>{formatNumber(usedQuota)} / {formatNumber(allocatedQuota)} {unit}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressBar} ${barClass}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statBoxLabel}>Định ngạch cấp</span>
          <span className={styles.statBoxValue}>{formatNumber(allocatedQuota)}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxLabel}>Đã sử dụng</span>
          <span className={styles.statBoxValue}>{formatNumber(usedQuota)}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxLabel}>Dung lượng còn</span>
          <span className={`${styles.statBoxValue} ${styles.remainingValue}`}>
            {formatNumber(remainingQuota)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function SubscriptionResourceUsage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getSubscriptionResourceUsage();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.errorMessage || "Không thể truy xuất thông tin sử dụng tài nguyên.");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  return (
    <div className={styles.page}>
      {/* ── Hero Banner ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <Link to="/profile">Hồ sơ cá nhân</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span>Tài nguyên đăng ký</span>
          </nav>

          <div className={styles.heroHeader}>
            <div className={styles.heroTitleGroup}>
              <h1>
                Sử dụng <em>Tài nguyên Đăng ký</em>
              </h1>
              <p>
                Quản lý định ngạch được cấp, theo dõi mức độ tiêu thụ và dung lượng tài nguyên còn
                lại theo gói đăng ký hiện tại của bạn.
              </p>
            </div>

            {data && (
              <div
                className={`${styles.planStatusBadge} ${
                  data.hasActiveSubscription ? styles.planActive : styles.planDefault
                }`}
              >
                <i
                  className={`fas ${data.hasActiveSubscription ? "fa-circle-check" : "fa-shield-halved"}`}
                  aria-hidden="true"
                />
                <span>{data.subscriptionPlanName}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <div className={styles.container}>
        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-circle-exclamation" aria-hidden="true" />
            <div>
              <strong>Thông báo hệ thống</strong>
              <p>{error}</p>
            </div>
            <button type="button" className={styles.retryBtn} onClick={fetchUsageData}>
              <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonCard} />
            ))}
          </div>
        )}

        {/* Ready Data View */}
        {!loading && data && (
          <>
            {/* Meta Card: Thông tin chi tiết gói nếu có active subscription */}
            <div className={styles.metaCard}>
              <div className={styles.metaInfo}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Gói hiện tại</span>
                  <span className={styles.metaValue}>{data.subscriptionPlanName}</span>
                </div>
                {data.hasActiveSubscription && (
                  <>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Ngày kích hoạt</span>
                      <span className={styles.metaValue}>{formatDate(data.activatedAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Ngày hết hạn</span>
                      <span className={styles.metaValue}>{formatDate(data.expiredAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Thời hạn còn lại</span>
                      <span className={styles.metaValue}>{data.remainingDays} ngày</span>
                    </div>
                  </>
                )}
              </div>

              <Link to="/subscription-plans" className={styles.upgradeBtn}>
                <i className="fas fa-gem" aria-hidden="true" />
                {data.hasActiveSubscription ? "Gia hạn / Nâng cấp gói" : "Khám phá gói đăng ký"}
              </Link>
            </div>

            {/* Resources List Header */}
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-chart-pie" aria-hidden="true" />
              Chi tiết sử dụng tài nguyên
            </h2>

            {/* Resources Cards Grid */}
            <div className={styles.grid}>
              {data.resources && data.resources.length > 0 ? (
                data.resources.map((res) => (
                  <ResourceCard key={res.resourceType} resource={res} />
                ))
              ) : (
                <p>Không có dữ liệu tài nguyên nào.</p>
              )}
            </div>

            {/* Guidance & Business Rules Info Box */}
            <div className={styles.infoBox}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-circle-info" aria-hidden="true" />
                Quy tắc và thông tin tài nguyên
              </h3>
              <ul className={styles.infoList}>
                <li className={styles.infoItem}>
                  <div className={styles.infoItemIcon}>
                    <i className="fas fa-user-lock" aria-hidden="true" />
                  </div>
                  <div className={styles.infoItemText}>
                    <h4>Quản lý tài khoản cá nhân (BR-01)</h4>
                    <p>
                      Bạn chỉ có thể theo dõi và xem hạn mức tài nguyên áp dụng cho chính tài khoản
                      đã đăng nhập của mình.
                    </p>
                  </div>
                </li>
                <li className={styles.infoItem}>
                  <div className={styles.infoItemIcon}>
                    <i className="fas fa-sliders" aria-hidden="true" />
                  </div>
                  <div className={styles.infoItemText}>
                    <h4>Xác định theo gói đăng ký (BR-02)</h4>
                    <p>
                      Định ngạch tài nguyên được tự động cập nhật theo gói đăng ký đang hoạt động của
                      bạn hoặc hạn mức mặc định nền tảng.
                    </p>
                  </div>
                </li>
                <li className={styles.infoItem}>
                  <div className={styles.infoItemIcon}>
                    <i className="fas fa-arrow-trend-up" aria-hidden="true" />
                  </div>
                  <div className={styles.infoItemText}>
                    <h4>Khấu trừ tài nguyên hoạt động (BR-03)</h4>
                    <p>
                      Tài nguyên sẽ được trừ dần khi bạn thực hiện các hoạt động học tập như hỏi đáp
                      AI Token, thực hành kịch bản AI hoặc gửi bài cho chuyên gia.
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
