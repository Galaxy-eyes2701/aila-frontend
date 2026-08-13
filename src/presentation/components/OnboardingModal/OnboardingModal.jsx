import { useState, useEffect } from "react";
import api from "@services/api";
import styles from "./OnboardingModal.module.css";

/* ── Dữ liệu tĩnh cho Step 1 & 2 (khớp enum backend) ─────────────────────── */
const LEARNER_TYPES = [
  { value: "Student", label: "Sinh viên", icon: "🎓" },
  { value: "OfficeWorker", label: "Nhân viên văn phòng", icon: "💼" },
  { value: "Freelancer", label: "Freelancer", icon: "🧑‍💻" },
  { value: "BusinessOwner", label: "Chủ doanh nghiệp", icon: "🏢" },
  { value: "CivilServant", label: "Cán bộ / Công chức", icon: "🏛️" },
  { value: "Retired", label: "Đã nghỉ hưu", icon: "🌿" },
];

const KNOWLEDGE_LEVELS = [
  {
    value: "Beginner",
    label: "Người mới bắt đầu",
    desc: "Chưa từng hoặc ít tiếp xúc với AI",
    icon: "🌱",
  },
  {
    value: "Intermediate",
    label: "Đã có kiến thức cơ bản",
    desc: "Đã dùng ChatGPT, Gemini hoặc các công cụ tương tự",
    icon: "🚀",
  },
  {
    value: "Advanced",
    label: "Có kinh nghiệm thực tế",
    desc: "Đã áp dụng AI trong công việc hoặc học tập",
    icon: "⚡",
  },
];

const TOTAL_STEPS = 3;

export default function OnboardingModal({ onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [learnerType, setLearnerType] = useState("");
  const [knowledgeLevel, setKLevel] = useState("");
  const [tags, setTags] = useState([]); // [{id, name}] từ API
  const [selectedTags, setSelected] = useState([]); // Guid[]
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState("");

  /* Fetch tags khi bắt đầu step 3 */
  useEffect(() => {
    if (step !== 3) return;
    const fetchTags = async () => {
      setTagsLoading(true);
      try {
        const res = await api.get("/tags/learner-interest");
        if (res.data.success) setTags(res.data.data);
      } catch {
        /* giữ danh sách rỗng */
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, [step]);

  const toggleTag = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const progress = (step / TOTAL_STEPS) * 100;

  /* ── SUBMIT cuối ── */
  const handleSubmit = async () => {
    if (selectedTags.length === 0) {
      setError("Vui lòng chọn ít nhất một lĩnh vực quan tâm.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.put("/learner/onboarding", {
        learnerType: learnerType,
        knowledgeLevel: knowledgeLevel,
        tagIds: selectedTags,
      });
      if (res.data.success) {
        setStep(4);
      } else {
        setError(res.data.errorMessage || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (err) {
      const msg = err.response?.data?.errorMessage;
      setError(msg || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* ── SKIP ── */
  const handleSkip = () => onClose?.();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Progress */}
        {step <= TOTAL_STEPS && (
          <>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`${styles.stepDot} ${s === step ? styles.active : ""} ${s < step ? styles.done : ""}`}
                />
              ))}
            </div>
          </>
        )}

        {/* ══ STEP 1: Đối tượng ══ */}
        {step === 1 && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>👋</div>
              <h2>Bạn là ai?</h2>
              <p>
                Chọn nhóm đối tượng phù hợp để chúng tôi gợi ý nội dung tốt hơn
                cho bạn.
              </p>
            </div>
            <div className={styles.body}>
              <div className={styles.optionGrid}>
                {LEARNER_TYPES.map(({ value, label, icon }) => (
                  <div
                    key={value}
                    className={`${styles.optionCard} ${learnerType === value ? styles.selected : ""}`}
                    onClick={() => setLearnerType(value)}
                  >
                    <div className={styles.optionIcon}>{icon}</div>
                    <div className={styles.optionLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.footer}>
              <button className={styles.btnSkip} onClick={handleSkip}>
                Bỏ qua
              </button>
              <button
                className={styles.btnNext}
                onClick={() => setStep(2)}
                disabled={!learnerType}
              >
                Tiếp theo <i className="fas fa-arrow-right" />
              </button>
            </div>
          </>
        )}

        {/* ══ STEP 2: Trình độ hiểu biết về AI ══ */}
        {step === 2 && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>🧠</div>
              <h2>Bạn hiểu AI đến đâu?</h2>
              <p>
                Điều này giúp chúng tôi gợi ý khóa học phù hợp với trình độ của
                bạn.
              </p>
            </div>
            <div className={styles.body}>
              <div className={styles.levelGrid}>
                {KNOWLEDGE_LEVELS.map(({ value, label, desc, icon }) => (
                  <div
                    key={value}
                    className={`${styles.levelCard} ${knowledgeLevel === value ? styles.selected : ""}`}
                    onClick={() => setKLevel(value)}
                  >
                    <div className={styles.levelIcon}>{icon}</div>
                    <div className={styles.levelInfo}>
                      <strong>{label}</strong>
                      <span>{desc}</span>
                    </div>
                    {knowledgeLevel === value && (
                      <i
                        className="fas fa-check-circle"
                        style={{ color: "var(--primary)", fontSize: 18 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.footer}>
              <button className={styles.btnSkip} onClick={() => setStep(1)}>
                <i className="fas fa-arrow-left" /> Quay lại
              </button>
              <button
                className={styles.btnNext}
                onClick={() => setStep(3)}
                disabled={!knowledgeLevel}
              >
                Tiếp theo <i className="fas fa-arrow-right" />
              </button>
            </div>
          </>
        )}

        {/* ══ STEP 3: Lĩnh vực quan tâm (Tags) ══ */}
        {step === 3 && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>🎯</div>
              <h2>Bạn muốn học gì?</h2>
              <p>
                Chọn các lĩnh vực bạn quan tâm để nhận gợi ý khóa học phù hợp.
              </p>
            </div>
            <div className={styles.body}>
              <p className={styles.tagHint}>
                Chọn ít nhất 1 lĩnh vực (có thể chọn nhiều)
              </p>
              {tagsLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "var(--text-muted)",
                  }}
                >
                  <i className="fas fa-spinner fa-spin" /> Đang tải...
                </div>
              ) : (
                <div className={styles.tagGrid}>
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`${styles.tagChip} ${selectedTags.includes(tag.id) ? styles.selected : ""}`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      Chưa có lĩnh vực nào được thêm.
                    </p>
                  )}
                </div>
              )}
              {error && (
                <div className={styles.error}>
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}
            </div>
            <div className={styles.footer}>
              <button className={styles.btnSkip} onClick={() => setStep(2)}>
                <i className="fas fa-arrow-left" /> Quay lại
              </button>
              <button
                className={styles.btnNext}
                onClick={handleSubmit}
                disabled={loading || selectedTags.length === 0}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} /> Đang lưu...
                  </>
                ) : (
                  <>
                    Hoàn tất <i className="fas fa-check" />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ══ STEP 4: Thành công ══ */}
        {step === 4 && (
          <div className={styles.successBody}>
            <div className={styles.successIcon}>🎉</div>
            <h3>Tất cả đã sẵn sàng!</h3>
            <p>
              Hồ sơ của bạn đã được cập nhật. Chúng tôi đã chuẩn bị những khóa
              học phù hợp nhất cho bạn. Hãy bắt đầu học ngay nhé!
            </p>
            <button
              className={styles.btnStart}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('onboarding-completed'));
                onComplete?.();
                onClose?.();
              }}
            >
              Bắt đầu học ngay 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
