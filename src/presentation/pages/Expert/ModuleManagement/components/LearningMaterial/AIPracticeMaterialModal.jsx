import { useEffect, useMemo, useState } from "react";
import styles from "./LearningMaterial.module.css";
import {
  createAIPracticeMaterial,
  getAIPracticeMaterialDetail,
  updateAIPracticeMaterial,
} from "@services/AipracticeApi";

// Khớp với AILA.Domain.Entities.AIPracticeMaterial (AddPromptTemplate /
// AddStepGuidance) — Easy = Prompt Template, Medium = Step Guidance,
// Hard = không có gì cả.
const DIFFICULTY_OPTIONS = [
  {
    value: 1,
    label: "Dễ",
    tag: "Có mẫu prompt gợi ý",
    desc: "Expert điền các mẫu prompt để học viên tham khảo khi thực hành.",
  },
  {
    value: 2,
    label: "Trung bình",
    tag: "Có hướng dẫn từng bước",
    desc: "Expert điền các bước hướng dẫn để dẫn dắt học viên thực hành.",
  },
  {
    value: 3,
    label: "Khó",
    tag: "Không có gợi ý",
    desc: "Không cần điền hướng dẫn hay mẫu prompt — học viên tự luyện hoàn toàn.",
  },
];

const emptyStepGuidance = () => ({ content: "" });
const emptyPromptTemplate = () => ({ title: "", content: "" });
const emptyScoringCriteria = () => ({ title: "", description: "", weight: "" });

const emptyBasic = {
  title: "",
  scenario: "",
  aiTask: "",
  learnerTask: "",
  difficulty: null,
  maxPromptAttempts: 3,
};

// BE có thể trả Difficulty dạng số (1/2/3) hoặc dạng tên enum
// ("Easy"/"Medium"/"Hard") tùy cấu hình serialize — chuẩn hóa về số để
// so sánh nhất quán trong toàn bộ component.
const DIFFICULTY_NAME_TO_VALUE = { Easy: 1, Medium: 2, Hard: 3 };
function normalizeDifficulty(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (DIFFICULTY_NAME_TO_VALUE[value] !== undefined) {
      return DIFFICULTY_NAME_TO_VALUE[value];
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export default function AIPracticeMaterialModal({
  open,
  module,
  material, // truyền vào khi Sửa (edit) — không truyền khi Tạo mới
  initialTitle,
  onClose,
  onSuccess,
}) {
  const isEditMode = !!material;

  const [basic, setBasic] = useState(emptyBasic);
  const [stepGuidances, setStepGuidances] = useState([emptyStepGuidance()]);
  const [promptTemplates, setPromptTemplates] = useState([emptyPromptTemplate()]);
  const [scoringCriteria, setScoringCriteria] = useState([emptyScoringCriteria()]);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [moduleId, setModuleId] = useState(module?.id ?? null);

  useEffect(() => {
    if (!open) return;
    setError("");
    setStepIndex(0);

    if (isEditMode) {
      setLoadingDetail(true);
      getAIPracticeMaterialDetail(material.id)
        .then((res) => {
          if (!res.success) {
            setError(res.errorMessage || "Không thể tải chi tiết Thực hành AI.");
            return;
          }
          const d = res.data;
          setModuleId(d.moduleId);
          setBasic({
            title: d.title ?? "",
            scenario: d.scenario ?? "",
            aiTask: d.aiTask ?? "",
            learnerTask: d.learnerTask ?? "",
            difficulty: normalizeDifficulty(d.difficulty),
            maxPromptAttempts: d.maxPromptAttempts ?? 3,
          });
          setStepGuidances(
            d.stepGuidances?.length
              ? [...d.stepGuidances]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((s) => ({ content: s.content }))
              : [emptyStepGuidance()],
          );
          setPromptTemplates(
            d.promptTemplates?.length
              ? d.promptTemplates.map((p) => ({
                title: p.title,
                content: p.content,
              }))
              : [emptyPromptTemplate()],
          );
          setScoringCriteria(
            d.scoringCriteria?.length
              ? d.scoringCriteria.map((c) => ({
                title: c.title,
                description: c.description ?? "",
                weight: c.weight,
              }))
              : [emptyScoringCriteria()],
          );
        })
        .catch((err) => {
          setError(
            err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.",
          );
        })
        .finally(() => setLoadingDetail(false));
    } else {
      setModuleId(module?.id ?? null);
      setBasic({ ...emptyBasic, title: initialTitle ?? "" });
      setStepGuidances([emptyStepGuidance()]);
      setPromptTemplates([emptyPromptTemplate()]);
      setScoringCriteria([emptyScoringCriteria()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, material?.id, initialTitle, module?.id]);

  // Danh sách bước hiển thị phụ thuộc độ khó đã chọn
  const flowSteps = useMemo(() => {
    const flow = ["basic"];
    if (basic.difficulty === 1) flow.push("promptTemplate");
    else if (basic.difficulty === 2) flow.push("stepGuidance");
    flow.push("scoring");
    return flow;
  }, [basic.difficulty]);

  if (!open) return null;

  if (loadingDetail) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: 640 }}>
          <div className={styles.loadingState}>
            <span className={styles.spinner} style={{ borderTopColor: "#2563eb", borderColor: "#dbeafe" }} />
            <p style={{ marginTop: 10 }}>Đang tải thông tin Thực hành AI...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = flowSteps[stepIndex];
  const isLastStep = stepIndex === flowSteps.length - 1;

  const stepTitles = {
    basic: "Thông tin thực hành AI",
    stepGuidance: "Hướng dẫn từng bước",
    promptTemplate: "Mẫu prompt gợi ý",
    scoring: "Tiêu chí chấm điểm",
  };

  function updateBasic(field, value) {
    setError("");
    setBasic((prev) => ({ ...prev, [field]: value }));
  }

  // ---- Step Guidance handlers ----
  function addStepGuidance() {
    setStepGuidances((prev) => [...prev, emptyStepGuidance()]);
  }
  function removeStepGuidance(index) {
    setStepGuidances((prev) => prev.filter((_, i) => i !== index));
  }
  function updateStepGuidance(index, value) {
    setStepGuidances((prev) =>
      prev.map((item, i) => (i === index ? { content: value } : item)),
    );
  }

  // ---- Prompt Template handlers ----
  function addPromptTemplate() {
    setPromptTemplates((prev) => [...prev, emptyPromptTemplate()]);
  }
  function removePromptTemplate(index) {
    setPromptTemplates((prev) => prev.filter((_, i) => i !== index));
  }
  function updatePromptTemplate(index, field, value) {
    setPromptTemplates((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  // ---- Scoring Criteria handlers ----
  function addScoringCriteria() {
    setScoringCriteria((prev) => [...prev, emptyScoringCriteria()]);
  }
  function removeScoringCriteria(index) {
    setScoringCriteria((prev) => prev.filter((_, i) => i !== index));
  }
  function updateScoringCriteria(index, field, value) {
    setScoringCriteria((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function validateStep(step) {
    if (step === "basic") {
      if (!basic.title.trim()) return "Tiêu đề không được để trống.";
      if (!basic.scenario.trim()) return "Vui lòng nhập bối cảnh.";
      if (!basic.aiTask.trim()) return "Vui lòng nhập nhiệm vụ của AI.";
      if (!basic.learnerTask.trim())
        return "Vui lòng nhập nhiệm vụ của học viên.";
      if (basic.difficulty === null) return "Vui lòng chọn độ khó.";
      if (Number(basic.maxPromptAttempts) <= 0)
        return "Số lượt prompt tối đa phải lớn hơn 0.";
      return "";
    }

    if (step === "stepGuidance") {
      if (stepGuidances.length === 0)
        return "Cần ít nhất một bước hướng dẫn.";
      if (stepGuidances.some((s) => !s.content.trim()))
        return "Nội dung bước hướng dẫn không được để trống.";
      return "";
    }

    if (step === "promptTemplate") {
      if (promptTemplates.length === 0)
        return "Cần ít nhất một mẫu prompt.";
      if (promptTemplates.some((p) => !p.title.trim() || !p.content.trim()))
        return "Tiêu đề và nội dung mẫu prompt không được để trống.";
      return "";
    }

    if (step === "scoring") {
      if (scoringCriteria.length === 0)
        return "Cần ít nhất một tiêu chí chấm điểm.";
      if (scoringCriteria.some((c) => !c.title.trim()))
        return "Tiêu đề tiêu chí chấm điểm không được để trống.";
      if (scoringCriteria.some((c) => Number(c.weight) <= 0))
        return "Trọng số của mỗi tiêu chí phải lớn hơn 0.";
      const totalWeight = scoringCriteria.reduce(
        (sum, c) => sum + (Number(c.weight) || 0),
        0,
      );
      if (totalWeight !== 100)
        return `Tổng trọng số hiện tại là ${totalWeight}%. Tổng trọng số các tiêu chí phải bằng đúng 100%.`;
      return "";
    }

    return "";
  }

  function goNext() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    setError("");
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function handleSubmit() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const sharedFields = {
        title: basic.title.trim(),
        scenario: basic.scenario.trim(),
        aiTask: basic.aiTask.trim(),
        learnerTask: basic.learnerTask.trim(),
        maxPromptAttempts: Number(basic.maxPromptAttempts),
        promptTemplates:
          basic.difficulty === 1 // Easy
            ? promptTemplates.map((p) => ({
              title: p.title.trim(),
              content: p.content.trim(),
            }))
            : [],
        stepGuidances:
          basic.difficulty === 2 // Medium
            ? stepGuidances.map((s, i) => ({
              orderIndex: i + 1,
              content: s.content.trim(),
            }))
            : [],
        scoringCriteria: scoringCriteria.map((c) => ({
          title: c.title.trim(),
          description: c.description.trim() || null,
          weight: Number(c.weight),
        })),
      };

      // UpdateAIPracticeMaterialDto không có moduleId/difficulty —
      // 2 field này cố định từ lúc tạo, không được đổi khi sửa.
      const res = isEditMode
        ? await updateAIPracticeMaterial(material.id, sharedFields)
        : await createAIPracticeMaterial({
          ...sharedFields,
          moduleId,
          difficulty: basic.difficulty,
        });

      if (res.success) {
        onSuccess(res.data);
      } else {
        setError(
          res.errorMessage ||
          (isEditMode
            ? "Không thể cập nhật học liệu Thực hành AI."
            : "Không thể tạo học liệu Thực hành AI."),
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 640 }}>
        <div className={styles.modalHeader}>
          <h2>{stepTitles[currentStep]}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={saving}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.stepIndicator}>
          {flowSteps.map((step, i) => (
            <div
              key={step}
              className={`${styles.stepDot} ${i === stepIndex ? styles.stepDotActive : ""
                } ${i < stepIndex ? styles.stepDotDone : ""}`}
            >
              {i < stepIndex ? <i className="fas fa-check" /> : i + 1}
            </div>
          ))}
        </div>

        {currentStep === "basic" && (
          <>
            <div className={styles.formGroup}>
              <label>Tiêu đề</label>
              <input
                value={basic.title}
                onChange={(e) => updateBasic("title", e.target.value)}
                placeholder="Nhập tên học liệu"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>Bối cảnh</label>
              <textarea
                rows={3}
                value={basic.scenario}
                onChange={(e) => updateBasic("scenario", e.target.value)}
                placeholder="Mô tả bối cảnh thực hành"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nhiệm vụ của AI</label>
              <textarea
                rows={2}
                value={basic.aiTask}
                onChange={(e) => updateBasic("aiTask", e.target.value)}
                placeholder="AI sẽ đóng vai trò gì trong tình huống này"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nhiệm vụ của học viên</label>
              <textarea
                rows={2}
                value={basic.learnerTask}
                onChange={(e) => updateBasic("learnerTask", e.target.value)}
                placeholder="Học viên cần làm gì"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Số lượt prompt tối đa</label>
              <input
                type="number"
                min="1"
                value={basic.maxPromptAttempts}
                onChange={(e) =>
                  updateBasic("maxPromptAttempts", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Độ khó</label>
              {isEditMode && (
                <p className={styles.hint} style={{ marginTop: -4 }}>
                  Độ khó không thể thay đổi sau khi tạo.
                </p>
              )}
              <div className={styles.difficultyGrid}>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`${styles.difficultyCard} ${basic.difficulty === opt.value
                      ? styles.difficultyCardActive
                      : ""
                      }`}
                    style={
                      isEditMode
                        ? {
                          cursor: "not-allowed",
                          opacity: basic.difficulty === opt.value ? 1 : 0.5,
                        }
                        : undefined
                    }
                    onClick={
                      isEditMode
                        ? undefined
                        : () => updateBasic("difficulty", opt.value)
                    }
                  >
                    <strong>{opt.label}</strong>
                    <span className={styles.difficultyTag}>{opt.tag}</span>
                    <p>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {currentStep === "stepGuidance" && (
          <div>
            <p className={styles.hint}>
              Các bước sẽ hiển thị cho học viên theo đúng thứ tự bên dưới.
            </p>
            {stepGuidances.map((item, index) => (
              <div key={index} className={styles.dynamicListCard}>
                <div className={styles.dynamicListHeader}>
                  <strong>Bước {index + 1}</strong>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => removeStepGuidance(index)}
                    disabled={stepGuidances.length <= 1}
                    title={
                      stepGuidances.length <= 1
                        ? "Cần giữ tối thiểu 1 bước"
                        : "Xóa bước"
                    }
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={item.content}
                  onChange={(e) => updateStepGuidance(index, e.target.value)}
                  placeholder={`Nội dung hướng dẫn bước ${index + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={addStepGuidance}
            >
              <i className="fas fa-plus" /> Thêm bước hướng dẫn
            </button>
          </div>
        )}

        {currentStep === "promptTemplate" && (
          <div>
            <p className={styles.hint}>
              Mỗi mẫu prompt gồm tiêu đề ngắn và nội dung gợi ý cho học viên.
            </p>
            {promptTemplates.map((item, index) => (
              <div key={index} className={styles.dynamicListCard}>
                <div className={styles.dynamicListHeader}>
                  <strong>Mẫu prompt {index + 1}</strong>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => removePromptTemplate(index)}
                    disabled={promptTemplates.length <= 1}
                    title={
                      promptTemplates.length <= 1
                        ? "Cần giữ tối thiểu 1 mẫu prompt"
                        : "Xóa mẫu prompt"
                    }
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <input
                  value={item.title}
                  onChange={(e) =>
                    updatePromptTemplate(index, "title", e.target.value)
                  }
                  placeholder="Tiêu đề mẫu prompt"
                  style={{ marginBottom: 8 }}
                />
                <textarea
                  rows={3}
                  value={item.content}
                  onChange={(e) =>
                    updatePromptTemplate(index, "content", e.target.value)
                  }
                  placeholder="Nội dung mẫu prompt"
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={addPromptTemplate}
            >
              <i className="fas fa-plus" /> Thêm mẫu prompt
            </button>
          </div>
        )}

        {currentStep === "scoring" && (
          <div>
            <p className={styles.hint}>
              Định nghĩa các tiêu chí và trọng số dùng để chấm điểm bài làm của
              học viên. Tổng trọng số của tất cả tiêu chí phải bằng đúng 100%.
            </p>
            {scoringCriteria.map((item, index) => (
              <div key={index} className={styles.dynamicListCard}>
                <div className={styles.dynamicListHeader}>
                  <strong>Tiêu chí {index + 1}</strong>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => removeScoringCriteria(index)}
                    disabled={scoringCriteria.length <= 1}
                    title={
                      scoringCriteria.length <= 1
                        ? "Cần giữ tối thiểu 1 tiêu chí"
                        : "Xóa tiêu chí"
                    }
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <input
                  value={item.title}
                  onChange={(e) =>
                    updateScoringCriteria(index, "title", e.target.value)
                  }
                  placeholder="Tên tiêu chí"
                  style={{ marginBottom: 8 }}
                />
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) =>
                    updateScoringCriteria(index, "description", e.target.value)
                  }
                  placeholder="Mô tả tiêu chí (không bắt buộc nhưng nếu có hệ thống sẽ có thể chấm điểm tốt hơn)"
                  style={{ marginBottom: 8 }}
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.weight}
                  onChange={(e) =>
                    updateScoringCriteria(index, "weight", e.target.value)
                  }
                  placeholder="Trọng số (%)"
                />
              </div>
            ))}
            <div
              className={styles.hint}
              style={{
                fontWeight: 600,
                color:
                  scoringCriteria.reduce(
                    (sum, c) => sum + (Number(c.weight) || 0),
                    0,
                  ) === 100
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              Tổng trọng số:{" "}
              {scoringCriteria.reduce(
                (sum, c) => sum + (Number(c.weight) || 0),
                0,
              )}
              % / 100%
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={addScoringCriteria}
            >
              <i className="fas fa-plus" /> Thêm tiêu chí
            </button>
          </div>
        )}

        {error && (
          <div className={styles.formError} style={{ marginTop: 16 }}>
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.modalActions}>
          {stepIndex > 0 && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={goBack}
              disabled={saving}
            >
              Quay lại
            </button>
          )}
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          {!isLastStep ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={goNext}
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" />{" "}
                  {isEditMode ? "Đang cập nhật..." : "Đang tạo..."}
                </>
              ) : isEditMode ? (
                <>
                  <i className="fas fa-check" /> Cập nhật
                </>
              ) : (
                <>
                  <i className="fas fa-plus" /> Tạo học liệu
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}