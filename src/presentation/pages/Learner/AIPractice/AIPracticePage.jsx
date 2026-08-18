import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resolveApiError } from "@services/api";
import {
  abandonAttempt,
  completeAttempt,
  createAttempt,
  getPracticeMaterialDetail,
  submitPrompt,
} from "@services/practiceApi";
import PracticeResult from "./components/PracticeResult";
import styles from "./AIPractice.module.css";

/**
 * UC-27 — Learner tham gia phiên luyện tập AI Practice.
 *
 * Route: /courses/:courseId/materials/:materialId/practice
 * Query params: enrollmentId (bắt buộc)
 *
 * Flow:
 *  1. Load material config (Step 2)
 *  2. Check / start session (Step 3-4)
 *  3. Chat loop (Step 5-11)
 *  4. Finish → UC-28 result (Step 12-14)
 */
export default function AIPracticePage() {
  const { courseId, materialId } = useParams();
  const navigate = useNavigate();

  // enrollmentId truyền qua URL search params
  const enrollmentId = new URLSearchParams(window.location.search).get("enrollmentId");

  // ── Material ──
  const [material, setMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [materialError, setMaterialError] = useState("");

  // ── Session ──
  const [attemptId, setAttemptId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  // ── Chat ──
  const [messages, setMessages] = useState([]); // { id, role: 'user'|'ai'|'violation', text }
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState(null); // { type, text }
  const [validTurns, setValidTurns] = useState(0);

  // ── Phase ──
  // loading | noEnrollment | starting | chat | finishing | done
  const [phase, setPhase] = useState("loading");
  const [result, setResult] = useState(null);

  // ── History toggle (UC-28) ──
  const [showHistory, setShowHistory] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ─────────────────────────────────────────────
  // Step 2: Load material config
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!enrollmentId) {
      setPhase("noEnrollment");
      setLoadingMaterial(false);
      return;
    }

    getPracticeMaterialDetail(materialId)
      .then((data) => {
        setMaterial(data);
        setPhase("starting");
      })
      .catch((err) => {
        const { errorMessage } = resolveApiError(err);
        setMaterialError(
          errorMessage || "Không thể tải thông tin tình huống. Vui lòng thử lại."
        );
        setPhase("error");
      })
      .finally(() => setLoadingMaterial(false));
  }, [materialId, enrollmentId]);

  // ─────────────────────────────────────────────
  // Step 3-4: Start / create session
  // ─────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!enrollmentId || !materialId) return;
    setStarting(true);
    setStartError("");
    try {
      const data = await createAttempt({ enrollmentId, materialId });
      // data = { Id: guid } hoặc { id: guid }
      const id = data?.id ?? data?.Id;
      setAttemptId(id);
      setPhase("chat");
      setTimeout(() => inputRef.current?.focus(), 80);
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setStartError(errorMessage || "Không thể bắt đầu phiên luyện tập.");
    } finally {
      setStarting(false);
    }
  }, [enrollmentId, materialId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-resize prompt textarea when prompt content changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 220) + "px";
    }
  }, [prompt]);

  // Abandon on unmount if still in progress (AF-07)
  useEffect(() => {
    return () => {
      if (attemptId && (phase === "chat")) {
        abandonAttempt(attemptId).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, phase]);

  // ─────────────────────────────────────────────
  // Step 5-9: Submit prompt
  // ─────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !attemptId || sending || phase !== "chat") return;

    setBanner(null);
    setPrompt("");
    setSending(true);

    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);

    try {
      const data = await submitPrompt(attemptId, text);

      if (data.status === "QuotaExceeded") {
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        setPrompt(text);
        setBanner({
          type: "error",
          text: data.warningMessage || "Hạn mức Token AI của bạn đã hết. Không thể tiếp tục.",
        });
        return;
      }

      if (data.isViolation || data.status === "Violation") {
        // AF-10: trả lại prompt để learner chỉnh sửa
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? { ...m, role: "violation", text: data.violationMessage || "Prompt vi phạm chính sách." }
              : m
          )
        );
        setBanner({
          type: "warn",
          text: data.violationMessage || "Prompt bị chặn. Vui lòng chỉnh sửa và gửi lại.",
        });
        setPrompt(text);
        return;
      }

      if (data.status === "ValidationError") {
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        setPrompt(text);
        setBanner({ type: "warn", text: data.warningMessage || "Prompt không hợp lệ." });
        return;
      }

      // Success
      const newValid = validTurns + 1;
      setValidTurns(newValid);
      setMessages((prev) => [
        ...prev,
        { id: (data.id ?? Date.now()) + "_ai", role: "ai", text: data.aiResponse },
      ]);

      if (data.warningMessage) {
        setBanner({ type: "warn", text: data.warningMessage });
      }

      // Step 11 — AF-04 hint khi đạt max turns
      const maxTurns = material?.maxPromptAttempts ?? 0;
      if (maxTurns > 0 && newValid >= maxTurns) {
        setBanner({
          type: "warn",
          text: `Bạn đã dùng hết ${maxTurns} lượt. Nhấn "Kết thúc thực hành" để nhận kết quả.`,
        });
      }
    } catch (err) {
      // AF-06 — AI lỗi, không trừ token
      const { errorMessage } = resolveApiError(err);
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      setPrompt(text);
      setBanner({
        type: "error",
        text: errorMessage || "AI tạm thời không phản hồi. Vui lòng thử lại.",
      });
    } finally {
      setSending(false);
    }
  }, [prompt, attemptId, sending, phase, validTurns, material]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─────────────────────────────────────────────
  // Step 12-14: Finish / AF-05 manual finish
  // ─────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (!attemptId) return;
    setPhase("finishing");
    setBanner(null);
    try {
      const data = await completeAttempt(attemptId);
      setResult(data);
      setPhase("done");
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setBanner({
        type: "error",
        text: errorMessage || "Không thể hoàn thành phiên luyện tập. Vui lòng thử lại.",
      });
      setPhase("chat");
    }
  }, [attemptId]);

  // ─────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────
  const maxTurns = material?.maxPromptAttempts ?? 0;
  const atLimit  = maxTurns > 0 && validTurns >= maxTurns;
  const nearLimit = maxTurns > 0 && validTurns === maxTurns - 1;
  const canSend  = phase === "chat" && !sending && !atLimit && !!attemptId;

  const hasAiReplied = messages.some((m) => m.role === "ai");

  // ─────────────────────────────────────────────
  // Practice Again (AF-03)
  // ─────────────────────────────────────────────
  const handlePracticeAgain = useCallback(() => {
    setMessages([]);
    setPrompt("");
    setBanner(null);
    setValidTurns(0);
    setAttemptId(null);
    setResult(null);
    setShowHistory(false);
    setPhase("starting");
  }, []);

  // ─────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────
  function renderBubble(msg) {
    if (msg.role === "user") {
      return (
        <div key={msg.id} className={styles.msgUser}>
          <p className={`${styles.msgLabel} ${styles.msgLabelRight}`}>Bạn</p>
          <div className={styles.bubbleUser}>{msg.text}</div>
        </div>
      );
    }
    if (msg.role === "violation") {
      return (
        <div key={msg.id} className={styles.msgUser}>
          <p className={`${styles.msgLabel} ${styles.msgLabelRight}`}>Bị chặn</p>
          <div className={styles.bubbleViolation}>
            <i className="fas fa-ban" style={{ marginRight: 6 }} />{msg.text}
          </div>
        </div>
      );
    }
    return (
      <div key={msg.id} className={styles.msgAi}>
        <p className={styles.msgLabel}>AI</p>
        <div className={styles.bubbleAi}>{msg.text}</div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loadingMaterial) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.center}>
            <div className={styles.spinnerLg} />
            <p>Đang tải tình huống thực hành...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // No enrollment
  // ─────────────────────────────────────────────
  if (phase === "noEnrollment") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to={`/learning/${courseId}`} className={styles.backBtn}>
            <i className="fas fa-arrow-left" /> Về khóa học
          </Link>
          <div className={styles.errorBox}>
            <i className="fas fa-circle-exclamation" />
            Không thể xác định thông tin ghi danh. Vui lòng truy cập từ trang học.
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Error loading material (AF-08)
  // ─────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to={`/learning/${courseId}`} className={styles.backBtn}>
            <i className="fas fa-arrow-left" /> Về khóa học
          </Link>
          <div className={styles.errorBox}>
            <i className="fas fa-circle-exclamation" />{materialError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <Link to={`/learning/${courseId}`} className={styles.backBtn}>
          <i className="fas fa-arrow-left" /> Về khóa học
        </Link>

        <div className={styles.headerGroup}>
          <div className={styles.headerBadge}>
            <i className="fas fa-robot" /> PHÂN KHÚC THỰC HÀNH AI
          </div>
          <h1 className={styles.pageTitle}>
            {material?.title ?? "Thực hành AI"}
          </h1>
          <p className={styles.pageSubtitle}>
            Luyện tập kỹ năng tương tác và viết prompt hiệu quả cùng AI
          </p>
        </div>

        {/* Scenario & Task Card */}
        {material && (
          <div className={styles.scenarioCard}>
            <div className={styles.scenarioHeader}>
              <div className={styles.scenarioIconBox}>
                <i className="fas fa-graduation-cap" />
              </div>
              <div className={styles.scenarioHeaderText}>
                <h2 className={styles.scenarioTitle}>Tình huống & Yêu cầu thực hành</h2>
                <div className={styles.scenarioTags}>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-comment-dots" /> Tối đa {maxTurns} lượt tương tác
                  </span>
                  {material.difficulty && (
                    <span className={styles.metaBadge}>
                      <i className="fas fa-signal" /> {
                        material.difficulty === 1 || material.difficulty === "Easy" ? "Độ khó: Dễ" :
                        material.difficulty === 2 || material.difficulty === "Medium" ? "Độ khó: Trung bình" :
                        "Độ khó: Nâng cao"
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.scenarioBody}>
              {material.scenario && (
                <div className={styles.scenarioSection}>
                  <div className={styles.sectionHeading}>
                    <i className="fas fa-book-open" /> Bối cảnh tình huống:
                  </div>
                  <p className={styles.scenarioText}>{material.scenario}</p>
                </div>
              )}

              {material.taskDescription && (
                <div className={styles.taskCard}>
                  <div className={styles.taskCardHeader}>
                    <i className="fas fa-bullseye" /> Nhiệm vụ của bạn:
                  </div>
                  <div className={styles.taskCardBody}>
                    {material.taskDescription}
                  </div>
                </div>
              )}
            </div>

            {/* If in starting phase, show start action directly inside the scenario card container */}
            {phase === "starting" && (
              <div className={styles.startActionArea}>
                {startError && (
                  <div className={styles.errorBox} style={{ width: "100%", marginBottom: 12 }}>
                    <i className="fas fa-circle-exclamation" /> {startError}
                  </div>
                )}
                <button
                  className={styles.startPracticeBtn}
                  onClick={handleStart}
                  disabled={starting}
                >
                  {starting ? (
                    <><i className="fas fa-spinner fa-spin" /> Đang chuẩn bị phiên...</>
                  ) : (
                    <><i className="fas fa-play" /> Bắt đầu thực hành</>
                  )}
                </button>
                <p className={styles.startHintText}>
                  <i className="fas fa-shield-halved" /> Hệ thống sẽ kiểm tra hạn mức AI Token trước khi bắt đầu.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Easy: prompt templates */}
        {phase === "chat" && material?.promptTemplates?.length > 0 && (
          <div className={styles.templateSection}>
            <p className={styles.templateLabel}>
              <i className="fas fa-lightbulb" style={{ marginRight: 4 }} />
              Mẫu prompt gợi ý (nhấn để dùng)
            </p>
            <div className={styles.templateList}>
              {material.promptTemplates.map((t) => (
                <button
                  key={t.id ?? t.Id}
                  className={styles.templateBtn}
                  onClick={() => setPrompt(t.content ?? t.Content)}
                  disabled={!canSend}
                >
                  {t.title ?? t.Title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Medium: step guidances */}
        {phase === "chat" && material?.stepGuidances?.length > 0 && (
          <div className={styles.stepsSection}>
            <p className={styles.stepsLabel}>
              <i className="fas fa-list-ol" style={{ marginRight: 4 }} />
              Hướng dẫn từng bước
            </p>
            <div className={styles.stepsList}>
              {material.stepGuidances
                .slice()
                .sort((a, b) => (a.stepOrder ?? a.StepOrder ?? 0) - (b.stepOrder ?? b.StepOrder ?? 0))
                .map((s, i) => (
                  <div key={s.id ?? s.Id ?? i} className={styles.stepItem}>
                    <span className={styles.stepNum}>{s.stepOrder ?? s.StepOrder ?? i + 1}</span>
                    <span>{s.guidanceText ?? s.GuidanceText}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Phase: chat ── */}
        {(phase === "chat" || phase === "finishing") && (
          <>
            <div className={styles.turnBarContainer}>
              <div className={styles.turnBarInfo}>
                <span className={styles.turnBarLabel}>
                  <i className="fas fa-comments" /> Tiến trình tương tác:
                </span>
                <span className={`${styles.turnCountBadge} ${nearLimit || atLimit ? styles.turnWarnBadge : ""}`}>
                  {validTurns}/{maxTurns} lượt
                  {atLimit && " (Đã hết lượt)"}
                </span>
              </div>
              <div className={styles.turnProgressTrack}>
                <div
                  className={`${styles.turnProgressFill} ${nearLimit || atLimit ? styles.turnProgressWarn : ""}`}
                  style={{ width: `${Math.min(100, (validTurns / (maxTurns || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className={styles.chatArea}>
              <div className={styles.chatMessages}>
                {messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <i className="fas fa-robot" />
                    <p>Gửi tin nhắn đầu tiên để bắt đầu tương tác với AI.</p>
                  </div>
                ) : (
                  messages.map(renderBubble)
                )}
                {sending && (
                  <div className={styles.msgAi}>
                    <p className={styles.msgLabel}>AI</p>
                    <div className={styles.typingBubble}>
                      <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {banner && (
                <div className={`${styles.banner} ${banner.type === "error" ? styles.bannerError : styles.bannerWarn}`}>
                  <i className={`fas ${banner.type === "error" ? "fa-circle-exclamation" : "fa-triangle-exclamation"}`} />
                  <span>{banner.text}</span>
                </div>
              )}

              <div className={styles.inputArea}>
                <textarea
                  ref={inputRef}
                  className={styles.promptInput}
                  rows={1}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setBanner(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={atLimit ? "Đã hết lượt tương tác" : "Nhập prompt của bạn... (Enter gửi, Shift+Enter xuống dòng)"}
                  disabled={!canSend}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={!canSend || !prompt.trim()}>
                  {sending ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />} Gửi
                </button>
              </div>
            </div>

            <div className={styles.actionBar}>
              <button
                className={styles.finishBtn}
                onClick={handleFinish}
                disabled={phase === "finishing" || !hasAiReplied}
              >
                {phase === "finishing"
                  ? <><i className="fas fa-spinner fa-spin" /> Đang tạo đánh giá...</>
                  : <><i className="fas fa-flag-checkered" /> Kết thúc thực hành</>}
              </button>
            </div>
          </>
        )}

        {/* ── Phase: done — UC-28 result ── */}
        {phase === "done" && result && (
          <>
            {/* Conversation history toggle */}
            <button
              className={styles.historyToggle}
              onClick={() => setShowHistory((v) => !v)}
            >
              <i className={`fas ${showHistory ? "fa-chevron-up" : "fa-chevron-down"}`} />
              {showHistory ? "Ẩn" : "Xem"} lịch sử hội thoại ({messages.filter((m) => m.role !== "violation").length} tin)
            </button>

            {showHistory && (
              <div className={styles.chatArea} style={{ marginBottom: 14 }}>
                <div className={styles.chatMessages}>
                  {messages.map(renderBubble)}
                </div>
              </div>
            )}

            <PracticeResult
              result={result}
              courseId={courseId}
              materialId={materialId}
              onPracticeAgain={handlePracticeAgain}
              attemptId={attemptId}
              // phase "done" nghĩa là completeAttempt đã chạy xong.
              attemptStatus="Completed"
            />
          </>
        )}
      </div>
    </div>
  );
}
