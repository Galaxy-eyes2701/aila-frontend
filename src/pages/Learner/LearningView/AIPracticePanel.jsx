import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPracticeMaterialDetail,
  listAttempts,
} from "../AIPractice/services/practiceApi";
import styles from "./LearningView.module.css";

/**
 * Panel hiển thị trong LearningContent khi học liệu là AiPractice.
 * Hiển thị tóm tắt kịch bản + nút "Bắt đầu thực hành" và lịch sử các lượt đã làm.
 */
export default function AIPracticePanel({
  courseId,
  materialId,
  enrollmentId,
  isCompleted,
  onCompleted,
}) {
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Load material detail
  useEffect(() => {
    setLoading(true);
    getPracticeMaterialDetail(materialId)
      .then((data) => setMaterial(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [materialId]);

  // Load attempt history if enrollmentId available
  useEffect(() => {
    if (!enrollmentId) return;
    setLoadingAttempts(true);
    listAttempts(enrollmentId)
      .then((data) => {
        // Filter attempts belonging to this material
        const list = Array.isArray(data) ? data : [];
        const filtered = list
          .filter((a) => (a.materialId ?? a.MaterialId) === materialId)
          .sort((a, b) => new Date(b.createdAt ?? b.CreatedAt) - new Date(a.createdAt ?? a.CreatedAt));
        setAttempts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoadingAttempts(false));
  }, [enrollmentId, materialId]);

  function handleStart() {
    if (!enrollmentId) {
      alert("Không thể xác định thông tin ghi danh. Vui lòng tải lại trang.");
      return;
    }
    navigate(
      `/courses/${courseId}/materials/${materialId}/practice?enrollmentId=${enrollmentId}`
    );
  }

  function handleViewFeedback(attemptId) {
    navigate(
      `/courses/${courseId}/materials/${materialId}/practice/${attemptId}/feedback`
    );
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  }

  function statusLabel(status) {
    const s = (status ?? "").toLowerCase();
    if (s === "completed") return { label: "Hoàn thành", color: "#16a34a" };
    if (s === "abandoned") return { label: "Bỏ dở",     color: "#d97706" };
    return                       { label: "Đang làm",   color: "#2563eb" };
  }

  if (loading) {
    return (
      <div className={styles.aiPracticePanel}>
        <div className={styles.aiPracticeLoading}>
          <i className="fas fa-spinner fa-spin" /> Đang tải kịch bản...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.aiPracticePanel}>
      {/* Header */}
      <div className={styles.aiPracticeHeader}>
        <i className="fas fa-robot" />
        <span>Thực hành AI</span>
        {isCompleted && (
          <span className={styles.aiPracticeCompletedBadge}>
            <i className="fas fa-check-circle" /> Đã hoàn thành
          </span>
        )}
      </div>

      {/* Scenario summary */}
      {material && (
        <div className={styles.aiPracticeBody}>
          <p className={styles.aiPracticeScenarioLabel}>Kịch bản</p>
          <p className={styles.aiPracticeScenario}>{material.scenario}</p>

          <div className={styles.aiPracticeMeta}>
            <span className={styles.aiPracticeMetaChip}>
              <i className="fas fa-bullseye" /> {material.taskDescription}
            </span>
            <span className={styles.aiPracticeMetaChip}>
              <i className="fas fa-comment-dots" /> Tối đa {material.maxPromptAttempts} lượt
            </span>
            <span className={styles.aiPracticeMetaChip}>
              <i className="fas fa-signal" /> {
                material.difficulty === 1 || material.difficulty === "Easy"   ? "Dễ" :
                material.difficulty === 2 || material.difficulty === "Medium" ? "Trung bình" :
                "Khó"
              }
            </span>
          </div>
        </div>
      )}

      {/* Start button */}
      <button className={styles.aiPracticeStartBtn} onClick={handleStart}>
        <i className="fas fa-play" /> Bắt đầu thực hành
      </button>

      {/* Attempt history */}
      {attempts.length > 0 && (
        <div className={styles.aiPracticeHistory}>
          <p className={styles.aiPracticeHistoryTitle}>
            <i className="fas fa-history" /> Lịch sử luyện tập ({attempts.length})
          </p>
          <div className={styles.aiPracticeHistoryList}>
            {attempts.map((a, i) => {
              const id     = a.id ?? a.Id;
              const status = a.status ?? a.Status ?? "";
              const score  = a.finalScore ?? a.FinalScore;
              const date   = a.createdAt ?? a.CreatedAt;
              const { label, color } = statusLabel(status);
              return (
                <div key={id ?? i} className={styles.aiPracticeAttemptRow}>
                  <div className={styles.aiPracticeAttemptInfo}>
                    <span className={styles.aiPracticeAttemptNum}>Lượt {attempts.length - i}</span>
                    <span className={styles.aiPracticeAttemptDate}>{formatDate(date)}</span>
                  </div>
                  <div className={styles.aiPracticeAttemptRight}>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>
                      {label}
                    </span>
                    {score != null && (
                      <span className={styles.aiPracticeAttemptScore}>
                        {Math.round(score)}/100
                      </span>
                    )}
                    {status.toLowerCase() === "completed" && (
                      <button
                        className={styles.aiPracticeViewBtn}
                        onClick={() => handleViewFeedback(id)}
                      >
                        <i className="fas fa-eye" /> Xem kết quả
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loadingAttempts && (
        <p className={styles.aiPracticeLoading} style={{ marginTop: 8 }}>
          <i className="fas fa-spinner fa-spin" /> Đang tải lịch sử...
        </p>
      )}
    </div>
  );
}
