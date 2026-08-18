import { useEffect, useState } from "react";
import styles from "./LearningMaterial.module.css";
import quizStyles from "./Quiz.module.css";
import {
  createQuestion,
  updateQuestion,
  getAnswerOptions,
  createAnswerOption,
  updateAnswerOption,
  deleteAnswerOption,
  reorderAnswerOptions,
  resolveApiError,
} from "@services/expertQuizApi";

const emptyOption = () => ({ id: null, content: "", isCorrect: false });

export default function QuestionFormModal({
  open,
  quizMaterialId,
  question, // null = tạo mới, có giá trị = sửa
  onClose,
  onSaved,
}) {
  const isEditMode = !!question;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [questionType, setQuestionType] = useState("SingleChoice");
  const [options, setOptions] = useState([emptyOption(), emptyOption()]);
  const [originalOptions, setOriginalOptions] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (isEditMode) {
      loadExisting();
    } else {
      setContent("");
      setQuestionType("SingleChoice");
      setOptions([emptyOption(), emptyOption()]);
      setOriginalOptions([]);
      setError("");
    }
  }, [open, question]);

  async function loadExisting() {
    try {
      setLoading(true);
      setError("");

      setContent(question.content ?? "");
      setQuestionType(question.questionType ?? "SingleChoice");

      const res = await getAnswerOptions(question.id);
      const loaded = (res.data ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((a) => ({
          id: a.id,
          content: a.content,
          isCorrect: a.isCorrect,
        }));

      setOptions(loaded.length > 0 ? loaded : [emptyOption(), emptyOption()]);
      setOriginalOptions(loaded);
    } catch (err) {
      const apiMsg =
        err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg || "Không thể tải câu hỏi.");
    } finally {
      setLoading(false);
    }
  }

  function addOptionRow() {
    setOptions((prev) => [...prev, emptyOption()]);
  }

  function removeOptionRow(index) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOptionContent(index, value) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, content: value } : o)),
    );
  }

  function setOptionCorrect(index, checked) {
    setOptions((prev) => {
      if (questionType === "SingleChoice") {
        return prev.map((o, i) => ({ ...o, isCorrect: i === index && checked }));
      }
      return prev.map((o, i) => (i === index ? { ...o, isCorrect: checked } : o));
    });
  }

  function handleTypeChange(newType) {
    setQuestionType(newType);

    // Chuyển sang SingleChoice mà đang có nhiều hơn 1 đáp án đúng
    // -> chỉ giữ lại đáp án đúng đầu tiên để form luôn hợp lệ
    if (newType === "SingleChoice") {
      setOptions((prev) => {
        let kept = false;
        return prev.map((o) => {
          if (o.isCorrect && !kept) {
            kept = true;
            return o;
          }
          return { ...o, isCorrect: false };
        });
      });
    }
  }

  function validate() {
    if (!content.trim()) return "Nội dung câu hỏi không được để trống.";

    if (options.length < 2) return "Cần ít nhất 2 đáp án.";

    if (options.some((o) => !o.content.trim()))
      return "Đáp án không được để trống.";

    const correctCount = options.filter((o) => o.isCorrect).length;

    if (questionType === "SingleChoice" && correctCount !== 1)
      return "Câu hỏi một đáp án phải có đúng một đáp án đúng.";

    if (questionType === "MultipleChoice" && correctCount === 0)
      return "Câu hỏi nhiều đáp án phải có ít nhất một đáp án đúng.";

    return "";
  }

  // Áp dụng danh sách đáp án lên server rồi trả về đúng thứ tự hiển thị của form.
  async function persistOptionsForCreate(questionId, workingOptions) {
    // Backend kiểm tra "đúng 1 / ít nhất 1 đáp án đúng" ngay sau MỖI lần tạo
    // đáp án -> phải tạo (các) đáp án đúng trước, đáp án sai sau, để không
    // bao giờ rơi vào trạng thái tạm thời vi phạm quy tắc.
    const creationOrder = [
      ...workingOptions.filter((o) => o.isCorrect),
      ...workingOptions.filter((o) => !o.isCorrect),
    ];

    for (const opt of creationOrder) {
      const res = await createAnswerOption(questionId, {
        content: opt.content.trim(),
        isCorrect: opt.isCorrect,
      });
      opt.id = res.data.id;
    }

    await fixDisplayOrder(questionId, workingOptions);
  }

  async function persistOptionsForEdit(questionId, workingOptions) {
    const originalIds = new Set(originalOptions.map((o) => o.id));
    const currentIds = new Set(
      workingOptions.filter((o) => o.id).map((o) => o.id),
    );

    const toDelete = originalOptions.filter((o) => !currentIds.has(o.id));
    const toUpdate = workingOptions.filter(
      (o) => o.id && originalIds.has(o.id),
    );
    const toCreate = workingOptions.filter((o) => !o.id);

    // Tạm thời nới lỏng sang MultipleChoice: Update câu hỏi KHÔNG kiểm tra lại
    // đáp án, nhờ vậy ta có thể tự do sửa/xóa/thêm đáp án mà không sợ backend
    // từ chối do trạng thái trung gian (ví dụ đổi đáp án đúng từ A sang B).
    await updateQuestion(quizMaterialId, questionId, {
      content: content.trim(),
      questionType: "MultipleChoice",
    });

    for (const opt of toUpdate) {
      await updateAnswerOption(questionId, opt.id, {
        content: opt.content.trim(),
        isCorrect: opt.isCorrect,
      });
    }

    for (const opt of toDelete) {
      await deleteAnswerOption(questionId, opt.id);
    }

    for (const opt of toCreate) {
      const res = await createAnswerOption(questionId, {
        content: opt.content.trim(),
        isCorrect: opt.isCorrect,
      });
      opt.id = res.data.id;
    }

    await fixDisplayOrder(questionId, workingOptions);

    // Đặt lại đúng loại câu hỏi + nội dung thật theo lựa chọn của Expert
    await updateQuestion(quizMaterialId, questionId, {
      content: content.trim(),
      questionType,
    });
  }

  async function fixDisplayOrder(questionId, workingOptions) {
    const items = workingOptions.map((opt, i) => ({
      answerOptionId: opt.id,
      newOrderIndex: i + 1,
    }));

    await reorderAnswerOptions(questionId, items);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const working = options.map((o) => ({ ...o }));

      if (isEditMode) {
        await persistOptionsForEdit(question.id, working);
      } else {
        const res = await createQuestion(quizMaterialId, {
          content: content.trim(),
          questionType,
        });

        await persistOptionsForCreate(res.data.id, working);
      }

      onSaved();
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Không thể lưu câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 640 }}>
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h2>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>Đang tải câu hỏi...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Nội dung câu hỏi</label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung câu hỏi"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Loại câu hỏi</label>
              <div className={quizStyles.typeToggle}>
                <div
                  className={`${quizStyles.typeOption} ${
                    questionType === "SingleChoice"
                      ? quizStyles.typeOptionActive
                      : ""
                  }`}
                  onClick={() => handleTypeChange("SingleChoice")}
                >
                  <i className="fas fa-circle-dot" /> Một đáp án đúng
                </div>

                <div
                  className={`${quizStyles.typeOption} ${
                    questionType === "MultipleChoice"
                      ? quizStyles.typeOptionActive
                      : ""
                  }`}
                  onClick={() => handleTypeChange("MultipleChoice")}
                >
                  <i className="fas fa-square-check" /> Nhiều đáp án đúng
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Đáp án</label>

              <div className={quizStyles.answerList}>
                {options.map((opt, index) => (
                  <div className={quizStyles.answerRow} key={index}>
                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) =>
                        updateOptionContent(index, e.target.value)
                      }
                      placeholder={`Đáp án ${index + 1}`}
                    />

                    <label className={quizStyles.correctToggle}>
                      <input
                        type={
                          questionType === "SingleChoice"
                            ? "radio"
                            : "checkbox"
                        }
                        name="correct-option"
                        checked={opt.isCorrect}
                        onChange={(e) =>
                          setOptionCorrect(index, e.target.checked)
                        }
                      />
                      Đúng
                    </label>

                    <button
                      type="button"
                      className={quizStyles.removeAnswerButton}
                      onClick={() => removeOptionRow(index)}
                      disabled={options.length <= 2}
                      title={
                        options.length <= 2
                          ? "Cần giữ tối thiểu 2 đáp án"
                          : "Xóa đáp án"
                      }
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={quizStyles.addAnswerButton}
                onClick={addOptionRow}
              >
                <i className="fas fa-plus" /> Thêm đáp án
              </button>
            </div>

            {error && (
              <div className={styles.formError}>
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={saving}
              >
                Hủy
              </button>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-floppy-disk" /> Lưu câu hỏi
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}