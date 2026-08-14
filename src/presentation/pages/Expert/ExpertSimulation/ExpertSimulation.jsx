import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "@state/hooks/useAuth";
import {
  finishSimulation,
  getSimulationDetail,
  startSimulation,
  submitSimulationPrompt,
} from "@services/simulationApi";
import { getAIPracticeMaterialDetail } from "@services/AipracticeApi";
import SimulationResult from "./components/SimulationResult";
import styles from "./ExpertSimulation.module.css";

const MAX_ROWS = 5;

/**
 * UC-60 — Expert chạy thử AI Practice Simulation.
 *
 * Route: /expert/simulation/:materialId
 *
 * Flow:
 *  1. Load material config (Step 2)
 *  2. Start session → nhận sessionId (Step 3-4)
 *  3. Chat loop (Step 5-11)
 *  4. Finish → show result (Step 12-14)
 */
export default function ExpertSimulation() {
  const { materialId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Material info ──
  const [material, setMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [materialError, setMaterialError] = useState("");

  // ── Session ──
  const [sessionId, setSessionId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  // ── Chat ──
  const [messages, setMessages] = useState([]); // { role: 'user'|'ai'|'violation', text, id }
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'warn'|'error', text }
  const [validTurns, setValidTurns] = useState(0);

  // ── Session state ──
  const [phase, setPhase] = useState("loading"); // loading | starting | chat | finishing | done
  const [result, setResult] = useState(null);

  // ── History toggle ──
  const [showHistory, setShowHistory] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ─────────────────────────────────────────────
  // Step 2: Load material config
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!materialId) return;
    setLoadingMaterial(true);
    getAIPracticeMaterialDetail(materialId)
      .then((res) => {
        if (!res.success) {
          setMaterialError(res.errorMessage || "Không thể tải thông tin học liệu.");
          setPhase("error");
          return;
        }
        setMaterial(res.data);
        setPhase("starting");
      })
      .catch(() => {
        setMaterialError("Lỗi kết nối máy chủ khi tải học liệu.");
        setPhase("error");
      })
      .finally(() => setLoadingMaterial(false));
  }, [materialId]);

  // ─────────────────────────────────────────────
  // Step 3-4: Start session
  // ─────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!user?.userId || !materialId) return;
    setStarting(true);
    setStartError("");
    try {
      const data = await startSimulation({
        expertId: user.userId,
        materialId,
      });
      // data = { simulationSessionId, message }
      setSessionId(data.simulationSessionId);
      setPhase("chat");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      const msg =
        err?.response?.data?.errorMessage ||
        err?.message ||
        "Không thể khởi tạo phiên thử nghiệm.";
      setStartError(msg);
    } finally {
      setStarting(false);
    }
  }, [user?.userId, materialId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ─────────────────────────────────────────────
  // Step 5-9: Submit prompt
  // ─────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = prompt.trim();
    if (!text || !sessionId || sending || phase !== "chat") return;

    setBanner(null);
    setPrompt("");
    setSending(true);

    // Optimistic user bubble
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);

    try {
      const data = await submitSimulationPrompt(sessionId, text);
      // data = PromptSubmissionDto: { id, userPrompt, aiResponse, status, isViolation, violationMessage, warningMessage }

      if (data.status === "QuotaExceeded") {
        // AF-03 — hết token
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        setPrompt(text);
        setBanner({ type: "error", text: data.warningMessage || "Hạn mức Token AI đã hết. Không thể tiếp tục thử nghiệm." });
        return;
      }

      if (data.isViolation || data.status === "Violation") {
        // AF-04 — sensitive info / policy violation
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
        setPrompt(text); // AF-04: trả lại prompt để expert chỉnh sửa
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
        { id: data.id + "_ai", role: "ai", text: data.aiResponse },
      ]);

      if (data.warningMessage) {
        setBanner({ type: "warn", text: data.warningMessage });
      }

      // Step 11 — AF-07: backend auto-complete khi đạt max turns, hiện nút Finish
      if (material && newValid >= material.maxPromptAttempts) {
        setBanner({
          type: "warn",
          text: `Đã đạt số lượt tối đa (${material.maxPromptAttempts}). Nhấn "Kết thúc thử nghiệm" để xem kết quả.`,
        });
      }
    } catch (err) {
      // AF-05/06 — AI service lỗi
      const msg =
        err?.response?.data?.errorMessage ||
        "AI tạm thời không phản hồi. Vui lòng thử lại.";
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      setPrompt(text);
      setBanner({ type: "error", text: msg });
    } finally {
      setSending(false);
    }
  }, [prompt, sessionId, sending, phase, validTurns, material]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─────────────────────────────────────────────
  // Step 12-14: Finish simulation
  // ─────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (!sessionId) return;
    setPhase("finishing");
    setBanner(null);
    try {
      const data = await finishSimulation(sessionId);
      // data = CompleteAttemptResponseDto: { finalScore, overallSuggestion, detailedScoring }
      setResult(data);
      setPhase("done");
    } catch (err) {
      const msg =
        err?.response?.data?.errorMessage ||
        "Không thể hoàn thành phiên thử nghiệm. Vui lòng thử lại.";
      setBanner({ type: "error", text: msg });
      setPhase("chat");
    }
  }, [sessionId]);

  // ─────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────
  const maxTurns = material?.maxPromptAttempts ?? 0;
  const nearLimit = maxTurns > 0 && validTurns >= maxTurns - 1;
  const atLimit = maxTurns > 0 && validTurns >= maxTurns;
  const canSend = phase === "chat" && !sending && !atLimit && !!sessionId;

  // ─────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────
  if (loadingMaterial) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.center}>
            <div className={styles.spinnerLg} />
            <p>Đang tải cấu hình tình huống...</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left" /> Quay lại
          </button>
          <div className={styles.errorBox} style={{ marginTop: 20 }}>
            <i className="fas fa-circle-exclamation" />
            {materialError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left" /> Quay lại
          </button>
          <h1 className={styles.headerTitle}>
            <i className="fas fa-flask" style={{ marginRight: 8 }} />
            Chạy thử: {material?.title}
          </h1>
          {phase === "chat" && (
            <span className={`${styles.headerBadge} ${styles.badgeInProgress}`}>
              <i className="fas fa-circle" style={{ fontSize: 8 }} /> Đang thử nghiệm
            </span>
          )}
          {phase === "done" && (
            <span className={`${styles.headerBadge} ${styles.badgeCompleted}`}>
              <i className="fas fa-check-circle" /> Hoàn thành
            </span>
          )}
        </div>

        {/* ── Scenario card ── */}
        {material && (
          <div className={styles.scenarioCard}>
            <p className={styles.scenarioTitle}>Tình huống thực hành</p>
            <p className={styles.scenarioText}>{material.scenario}</p>
            <div className={styles.scenarioMeta}>
              <span className={styles.metaTag}>
                <i className="fas fa-bullseye" /> {material.learnerTask}
              </span>
              <span className={styles.metaTag}>
                <i className="fas fa-comment-dots" /> Tối đa {maxTurns} lượt
              </span>
            </div>
          </div>
        )}

        {/* ── Phase: starting (before session created) ── */}
        {phase === "starting" && (
          <div className={styles.center} style={{ minHeight: 200 }}>
            {startError && (
              <div className={styles.errorBox}>
                <i className="fas fa-circle-exclamation" />
                {startError}
              </div>
            )}
            <button
              className={styles.finishBtn}
              style={{ background: "#2563eb" }}
              onClick={handleStart}
              disabled={starting}
            >
              {starting ? (
                <><i className="fas fa-spinner fa-spin" /> Đang khởi động...</>
              ) : (
                <><i className="fas fa-play" /> Bắt đầu thử nghiệm</>
              )}
            </button>
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
              Hệ thống sẽ kiểm tra hạn mức Token AI của bạn trước khi bắt đầu.
            </p>
          </div>
        )}

        {/* ── Phase: chat ── */}
        {(phase === "chat" || phase === "finishing") && (
          <>
            {/* Turn counter */}
            <p className={`${styles.turnInfo} ${nearLimit ? styles.turnWarning : ""}`}>
              <i className="fas fa-comments" />{" "}
              {validTurns}/{maxTurns} lượt đã dùng
              {atLimit && " — Đã đạt giới hạn"}
            </p>

            {/* Chat area */}
            <div className={styles.chatArea}>
              <div className={styles.chatMessages}>
                {messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <i className="fas fa-robot" />
                    <p>Gửi tin nhắn đầu tiên để bắt đầu tương tác với AI.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <div key={msg.id} className={styles.messageUser}>
                          <p className={`${styles.messageLabel} ${styles.messageLabelRight}`}>Bạn</p>
                          <div className={styles.bubbleUser}>{msg.text}</div>
                        </div>
                      );
                    }
                    if (msg.role === "violation") {
                      return (
                        <div key={msg.id} className={styles.messageUser}>
                          <p className={`${styles.messageLabel} ${styles.messageLabelRight}`}>Bạn (bị chặn)</p>
                          <div className={styles.bubbleViolation}>
                            <i className="fas fa-ban" style={{ marginRight: 6 }} />
                            {msg.text}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className={styles.messageAi}>
                        <p className={styles.messageLabel}>AI</p>
                        <div className={styles.bubbleAi}>{msg.text}</div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {sending && (
                  <div className={styles.messageAi}>
                    <p className={styles.messageLabel}>AI</p>
                    <div className={styles.typingBubble}>
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Warning/error banner inside chat */}
              {banner && (
                <div className={`${styles.banner} ${banner.type === "error" ? styles.bannerError : styles.bannerWarn}`}>
                  <i className={`fas ${banner.type === "error" ? "fa-circle-exclamation" : "fa-triangle-exclamation"}`} />
                  <span>{banner.text}</span>
                </div>
              )}

              {/* Input */}
              <div className={styles.inputArea}>
                <textarea
                  ref={inputRef}
                  className={styles.promptInput}
                  rows={1}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setBanner(null);
                    // auto-grow
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={atLimit ? "Đã đạt số lượt tối đa" : "Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"}
                  disabled={!canSend}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={!canSend || !prompt.trim()}>
                  {sending ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
                  Gửi
                </button>
              </div>
            </div>

            {/* Finish button */}
            <div className={styles.actionRow}>
              <button
                className={styles.finishBtn}
                onClick={handleFinish}
                disabled={phase === "finishing" || messages.filter((m) => m.role === "ai").length === 0}
              >
                {phase === "finishing" ? (
                  <><i className="fas fa-spinner fa-spin" /> Đang tạo đánh giá...</>
                ) : (
                  <><i className="fas fa-flag-checkered" /> Kết thúc thử nghiệm</>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Phase: done — show result ── */}
        {phase === "done" && result && (
          <>
            {/* Conversation history accordion */}
            <div className={styles.actionRow} style={{ justifyContent: "flex-start", marginBottom: 12 }}>
              <button
                className={styles.historyToggle}
                onClick={() => setShowHistory((v) => !v)}
              >
                <i className={`fas ${showHistory ? "fa-chevron-up" : "fa-chevron-down"}`} />
                {showHistory ? "Ẩn" : "Xem"} lịch sử hội thoại ({messages.filter((m) => m.role !== "violation").length} tin)
              </button>
            </div>

            {showHistory && (
              <div className={styles.chatArea} style={{ marginBottom: 16 }}>
                <div className={styles.chatMessages}>
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <div key={msg.id} className={styles.messageUser}>
                          <p className={`${styles.messageLabel} ${styles.messageLabelRight}`}>Bạn</p>
                          <div className={styles.bubbleUser}>{msg.text}</div>
                        </div>
                      );
                    }
                    if (msg.role === "violation") {
                      return (
                        <div key={msg.id} className={styles.messageUser}>
                          <p className={`${styles.messageLabel} ${styles.messageLabelRight}`}>Bị chặn</p>
                          <div className={styles.bubbleViolation}>
                            <i className="fas fa-ban" style={{ marginRight: 6 }} />{msg.text}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className={styles.messageAi}>
                        <p className={styles.messageLabel}>AI</p>
                        <div className={styles.bubbleAi}>{msg.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Result panel */}
            <SimulationResult result={result} onRetry={() => navigate(0)} />
          </>
        )}
      </div>
    </div>
  );
}
