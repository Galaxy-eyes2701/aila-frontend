import { useEffect, useState } from "react";
import styles from "./LearningMaterial.module.css";
import quizStyles from "./Quiz.module.css";
import { bulkCreateQuiz, resolveApiError } from "@services/expertQuizApi";

const emptyAnswer = () => ({ content: "", isCorrect: false });

const emptyQuestion = () => ({
  content: "",
  questionType: "SingleChoice",
  answers: [emptyAnswer(), emptyAnswer()],
});

export default function BulkCreateQuizModal({
  open,
  material,
  initialSettings,
  onClose,
  onSuccess,
}) {
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(70);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTimeLimitMinutes(initialSettings?.timeLimitMinutes ?? 30);
    setPassingScore(initialSettings?.passingScore ?? 70);
    setShowCorrectAnswers(initialSettings?.showCorrectAnswers ?? true);
    setQuestions([emptyQuestion()]);
    setError("");
  }, [open, initialSettings]);

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(qIndex) {
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  }

  function updateQuestionContent(qIndex, value) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, content: value } : q)),
    );
  }

  function handleQuestionTypeChange(qIndex, newType) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        if (newType !== "SingleChoice") return { ...q, questionType: newType };

        // Chuyển sang SingleChoice: chỉ giữ đáp án đúng đầu tiên
        let kept = false;
        const answers = q.answers.map((a) => {
          if (a.isCorrect && !kept) {
            kept = true;
            return a;
          }
          return { ...a, isCorrect: false };
        });
        return { ...q, questionType: newType, answers };
      }),
    );
  }

  function addAnswer(qIndex) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, answers: [...q.answers, emptyAnswer()] } : q,
      ),
    );
  }

  function removeAnswer(qIndex, aIndex) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, answers: q.answers.filter((_, j) => j !== aIndex) }
          : q,
      ),
    );
  }

  function updateAnswerContent(qIndex, aIndex, value) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              answers: q.answers.map((a, j) =>
                j === aIndex ? { ...a, content: value } : a,
              ),
            }
          : q,
      ),
    );
  }

  function setAnswerCorrect(qIndex, aIndex, checked) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const answers =
          q.questionType === "SingleChoice"
            ? q.answers.map((a, j) => ({
                ...a,
                isCorrect: j === aIndex && checked,
              }))
            : q.answers.map((a, j) =>
                j === aIndex ? { ...a, isCorrect: checked } : a,
              );
        return { ...q, answers };
      }),
    );
  }

  function validate() {
    if (Number(timeLimitMinutes) <= 0)
      return "Thời gian làm bài phải lớn hơn 0 phút.";

    if (Number(passingScore) < 0 || Number(passingScore) > 100)
      return "Điểm đạt phải nằm trong khoảng từ 0 đến 100.";

    if (!questions.length) return "Quiz phải có ít nhất một câu hỏi.";

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const label = `Câu hỏi ${i + 1}`;

      if (!q.content.trim()) return `${label}: nội dung không được để trống.`;
      if (q.content.trim().length > 2000)
        return `${label}: nội dung không được vượt quá 2000 ký tự.`;
      if (q.answers.length < 2) return `${label}: cần ít nhất 2 đáp án.`;
      if (q.answers.some((a) => !a.content.trim()))
        return `${label}: đáp án không được để trống.`;
      if (q.answers.some((a) => a.content.trim().length > 1000))
        return `${label}: đáp án không được vượt quá 1000 ký tự.`;

      const correctCount = q.answers.filter((a) => a.isCorrect).length;
      if (q.questionType === "SingleChoice" && correctCount !== 1)
        return `${label}: câu hỏi một đáp án phải có đúng một đáp án đúng.`;
      if (q.questionType === "MultipleChoice" && correctCount === 0)
        return `${label}: câu hỏi nhiều đáp án phải có ít nhất một đáp án đúng.`;
    }

    return "";
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

      const res = await bulkCreateQuiz(material.id, {
        timeLimitMinutes: Number(timeLimitMinutes),
        passingScore: Number(passingScore),
        showCorrectAnswersAfterSubmission: showCorrectAnswers,
        questions: questions.map((q) => ({
          content: q.content.trim(),
          questionType: q.questionType,
          answers: q.answers.map((a) => ({
            content: a.content.trim(),
            isCorrect: a.isCorrect,
          })),
        })),
      });

      if (!res.success) {
        setError(res.errorMessage || "Không thể tạo nhanh Quiz.");
        return;
      }

      onSuccess();
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Không thể tạo nhanh Quiz.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 720 }}>
        <div className={styles.modalHeader}>
          <h2>Tạo nhanh nhiều câu hỏi</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={quizStyles.settingsGrid}>
            <div className={styles.formGroup}>
              <label>Thời gian làm bài (phút)</label>
              <input
                type="number"
                min="1"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Điểm đạt (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>

          <label className={quizStyles.checkboxRow}>
            <input
              type="checkbox"
              checked={showCorrectAnswers}
              onChange={(e) => setShowCorrectAnswers(e.target.checked)}
            />
            Hiện đáp án đúng sau khi học viên nộp bài
          </label>

          <hr className={quizStyles.divider} />

          <div className={quizStyles.bulkScrollArea}>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className={quizStyles.bulkQuestionCard}>
                <div className={quizStyles.bulkQuestionHeader}>
                  <strong>Câu hỏi {qIndex + 1}</strong>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length <= 1}
                    title={
                      questions.length <= 1
                        ? "Cần giữ tối thiểu 1 câu hỏi"
                        : "Xóa câu hỏi"
                    }
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <textarea
                    rows={2}
                    value={q.content}
                    onChange={(e) =>
                      updateQuestionContent(qIndex, e.target.value)
                    }
                    placeholder="Nhập nội dung câu hỏi"
                  />
                </div>

                <div className={quizStyles.typeToggle}>
                  <div
                    className={`${quizStyles.typeOption} ${
                      q.questionType === "SingleChoice"
                        ? quizStyles.typeOptionActive
                        : ""
                    }`}
                    onClick={() =>
                      handleQuestionTypeChange(qIndex, "SingleChoice")
                    }
                  >
                    <i className="fas fa-circle-dot" /> Một đáp án đúng
                  </div>
                  <div
                    className={`${quizStyles.typeOption} ${
                      q.questionType === "MultipleChoice"
                        ? quizStyles.typeOptionActive
                        : ""
                    }`}
                    onClick={() =>
                      handleQuestionTypeChange(qIndex, "MultipleChoice")
                    }
                  >
                    <i className="fas fa-square-check" /> Nhiều đáp án đúng
                  </div>
                </div>

                <div className={quizStyles.answerList}>
                  {q.answers.map((a, aIndex) => (
                    <div className={quizStyles.answerRow} key={aIndex}>
                      <input
                        type="text"
                        value={a.content}
                        onChange={(e) =>
                          updateAnswerContent(qIndex, aIndex, e.target.value)
                        }
                        placeholder={`Đáp án ${aIndex + 1}`}
                      />
                      <label className={quizStyles.correctToggle}>
                        <input
                          type={
                            q.questionType === "SingleChoice"
                              ? "radio"
                              : "checkbox"
                          }
                          name={`correct-option-${qIndex}`}
                          checked={a.isCorrect}
                          onChange={(e) =>
                            setAnswerCorrect(qIndex, aIndex, e.target.checked)
                          }
                        />
                        Đúng
                      </label>
                      <button
                        type="button"
                        className={quizStyles.removeAnswerButton}
                        onClick={() => removeAnswer(qIndex, aIndex)}
                        disabled={q.answers.length <= 2}
                        title={
                          q.answers.length <= 2
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
                  onClick={() => addAnswer(qIndex)}
                >
                  <i className="fas fa-plus" /> Thêm đáp án
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={quizStyles.bulkAddQuestionButton}
            onClick={addQuestion}
          >
            <i className="fas fa-plus" /> Thêm câu hỏi
          </button>

          {error && (
            <div className={styles.formError} style={{ marginTop: 16 }}>
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
                  <i className="fas fa-spinner fa-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <i className="fas fa-bolt" /> Tạo nhanh Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
