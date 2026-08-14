import { useEffect, useState } from "react";
import styles from "./LearningMaterial.module.css";
import quizStyles from "./Quiz.module.css";
import {
  getQuizDetail,
  updateQuizDetail,
  getQuestions,
  deleteQuestion,
  reorderQuestions,
  resolveApiError,
} from "@services/expertQuizApi";
import QuestionFormModal from "./QuestionFormModal";
import BulkCreateQuizModal from "./BulkCreateQuizModal";
import QuestionImportModal from "./QuestionImportModal";
import ConfirmModal from "../ConfirmModal";

export default function QuizDetailModal({
  open,
  material,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState("");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(70);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);

  const [quizExists, setQuizExists] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [busyQuestionId, setBusyQuestionId] = useState("");

  const [questionModal, setQuestionModal] = useState(null);
  // null | { mode: "create" } | { mode: "edit", question }

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteTargetQuestion, setDeleteTargetQuestion] = useState(null);

  useEffect(() => {
    if (!open || !material) return;

    loadAll();
  }, [open, material]);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const settingsRes = await getQuizDetail(material.id);
      const data = settingsRes.data;

      setTimeLimitMinutes(data.timeLimitMinutes ?? 30);
      setPassingScore(data.passingScore ?? 70);
      setShowCorrectAnswers(data.showCorrectAnswersAfterSubmission ?? true);

      await loadQuestions();
    } catch (err) {
      const apiMsg =
        err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg || "Không thể tải thông tin Quiz.");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions() {
    try {
      const res = await getQuestions(material.id);
      setQuestions(
        (res.data ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex),
      );
      setQuizExists(true);
    } catch (err) {
      if (err.response?.data?.errorCode === "QUIZ_NOT_FOUND") {
        setQuestions([]);
        setQuizExists(false);
      } else {
        const apiMsg =
          err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
        setError(apiMsg || "Không thể tải danh sách câu hỏi.");
      }
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();

    if (Number(timeLimitMinutes) <= 0) {
      setError("Thời gian làm bài phải lớn hơn 0 phút.");
      return;
    }

    if (Number(passingScore) < 0 || Number(passingScore) > 100) {
      setError("Điểm đạt phải nằm trong khoảng từ 0 đến 100.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSettingsSaved(false);

      const res = await updateQuizDetail(material.id, {
        timeLimitMinutes: Number(timeLimitMinutes),
        passingScore: Number(passingScore),
        showCorrectAnswersAfterSubmission: showCorrectAnswers,
      });

      if (!res.success) {
        setError(res.errorMessage || "Không thể lưu cài đặt Quiz.");
        return;
      }

      if (!quizExists) {
        await loadQuestions();
      }

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      const apiMsg =
        err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg || "Không thể lưu cài đặt Quiz.");
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteQuestion(question) {
    setDeleteTargetQuestion(question);
  }

  async function confirmDeleteQuestion() {
    if (!deleteTargetQuestion) return;
    const question = deleteTargetQuestion;

    setBusyQuestionId(question.id);

    try {
      await deleteQuestion(material.id, question.id);
      setDeleteTargetQuestion(null);
      await loadQuestions();
    } catch (err) {
      const apiMsg =
        err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg || "Không thể xóa câu hỏi.");
    } finally {
      setBusyQuestionId("");
    }
  }

  async function moveQuestion(questionId, direction) {
    const index = questions.findIndex((q) => q.id === questionId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= questions.length) return;

    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);

    setQuestions(reordered);

    try {
      const items = reordered.map((q, i) => ({
        questionId: q.id,
        newOrderIndex: i + 1,
      }));

      const res = await reorderQuestions(material.id, items);
      if (!res.success) {
        setError(res.errorMessage || "Không thể sắp xếp câu hỏi.");
        await loadQuestions();
        return;
      }
      await loadQuestions();
    } catch (err) {
      const apiMsg =
        err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg || "Không thể sắp xếp câu hỏi.");
      await loadQuestions();
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 640 }}>
        <div className={styles.modalHeader}>
          <h2>Chi tiết câu hỏi</h2>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>Đang tải thông tin Quiz...</div>
        ) : (
          <>
            <div className={styles.formGroup}>
              <label>Tiêu đề</label>
              <input value={material.title} disabled />
            </div>

            <form onSubmit={handleSaveSettings}>
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

              {error && (
                <div className={styles.formError} style={{ marginTop: 16 }}>
                  <i className="fas fa-circle-exclamation" />
                  <span>{error}</span>
                </div>
              )}

              {settingsSaved && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#16a34a",
                    fontSize: 13,
                    fontWeight: 600,
                    marginTop: 16,
                  }}
                >
                  <i className="fas fa-circle-check" />
                  <span>Đã lưu cài đặt.</span>
                </div>
              )}

              <div className={styles.modalActions}>
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
                      <i className="fas fa-floppy-disk" /> Lưu cài đặt
                    </>
                  )}
                </button>
              </div>
            </form>

            <hr className={quizStyles.divider} />

            <div className={quizStyles.sectionHeader}>
              <h3>Danh sách câu hỏi ({questions.length})</h3>

              <div className={quizStyles.sectionHeaderActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setBulkModalOpen(true)}
                >
                  <i className="fas fa-bolt" /> Tạo nhanh nhiều câu hỏi
                </button>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={!quizExists}
                  onClick={() => setImportModalOpen(true)}
                  title={!quizExists ? "Lưu cài đặt Quiz trước khi import" : ""}
                >
                  <i className="fas fa-file-import" /> Import từ Excel
                </button>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={!quizExists}
                  onClick={() => setQuestionModal({ mode: "create" })}
                >
                  <i className="fas fa-plus" /> Thêm câu hỏi
                </button>
              </div>
            </div>

            {!quizExists && (
              <div className={quizStyles.hintText}>
                Vui lòng lưu cài đặt Quiz trước khi thêm câu hỏi.
              </div>
            )}

            {quizExists && questions.length === 0 && (
              <div className={styles.empty}>Chưa có câu hỏi nào.</div>
            )}

            {questions.length > 0 && (
              <div className={quizStyles.questionList}>
                {questions.map((q, index) => (
                  <div className={quizStyles.questionItem} key={q.id}>
                    <div className={quizStyles.questionOrder}>
                      <span>{index + 1}</span>
                      <div className={quizStyles.orderButtons}>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveQuestion(q.id, -1)}
                        >
                          <i className="fas fa-arrow-up" />
                        </button>
                        <button
                          type="button"
                          disabled={index === questions.length - 1}
                          onClick={() => moveQuestion(q.id, 1)}
                        >
                          <i className="fas fa-arrow-down" />
                        </button>
                      </div>
                    </div>

                    <div className={quizStyles.questionBody}>
                      <div className={quizStyles.questionContent}>
                        {q.content}
                      </div>

                      <div className={quizStyles.questionMeta}>
                        <span
                          className={`${quizStyles.badge} ${
                            q.questionType === "SingleChoice"
                              ? quizStyles.badgeSingle
                              : quizStyles.badgeMultiple
                          }`}
                        >
                          {q.questionType === "SingleChoice"
                            ? "Một đáp án"
                            : "Nhiều đáp án"}
                        </span>
                        <span>{q.answerCount} đáp án</span>
                      </div>
                    </div>

                    <div className={quizStyles.questionActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        disabled={busyQuestionId === q.id}
                        onClick={() =>
                          setQuestionModal({ mode: "edit", question: q })
                        }
                      >
                        <i className="fas fa-pen" />
                      </button>

                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.deleteButton}`}
                        disabled={busyQuestionId === q.id}
                        onClick={() => handleDeleteQuestion(q)}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <QuestionFormModal
        open={!!questionModal}
        quizMaterialId={material?.id}
        question={
          questionModal?.mode === "edit" ? questionModal.question : null
        }
        onClose={() => setQuestionModal(null)}
        onSaved={() => {
          setQuestionModal(null);
          loadQuestions();
        }}
      />
      <BulkCreateQuizModal
        open={bulkModalOpen}
        material={material}
        initialSettings={{ timeLimitMinutes, passingScore, showCorrectAnswers }}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={() => {
          setBulkModalOpen(false);
          loadAll();
        }}
      />
      <QuestionImportModal
        open={importModalOpen}
        quizMaterialId={material?.id}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          setImportModalOpen(false);
          loadQuestions();
        }}
      />
      <ConfirmModal
        open={!!deleteTargetQuestion}
        title="Xóa câu hỏi này?"
        description={`Bạn có chắc chắn muốn xóa câu hỏi "${deleteTargetQuestion?.content}" khỏi bài Quiz?`}
        confirmLabel="Xóa câu hỏi"
        cancelLabel="Hủy"
        tone="danger"
        busy={!!busyQuestionId}
        onConfirm={confirmDeleteQuestion}
        onClose={() => setDeleteTargetQuestion(null)}
      />
    </div>
  );
}
