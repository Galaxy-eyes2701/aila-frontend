import { useCallback, useEffect, useRef, useState } from "react";
import { resolveApiError } from "@services/api";
import { askQuestion, getChatMessages, getOrCreateChatSession } from "@services/ragApi";
import styles from "./AIChatWidget.module.css";

/**
 * UC-31 — AI Learning Assistant chat widget.
 * Floating button → slide-up panel. Nhúng vào LearningView.
 *
 * @param {string} courseId  - khóa học hiện tại
 */
export default function AIChatWidget({ courseId }) {
  const [open, setOpen]           = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // messages: { id, role: 'user'|'assistant', content, citations, isGeneral }
  const [messages,   setMessages]   = useState([]);
  const [question,   setQuestion]   = useState("");
  const [sending,    setSending]    = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [banner,     setBanner]     = useState(null); // { type, text }

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ─────────────────────────────────────────────
  // Init session khi mở lần đầu
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!open || sessionId) return; // đã có session hoặc chưa mở

    setInitLoading(true);
    getOrCreateChatSession(courseId)
      .then(async (sessionDto) => {
        const id = sessionDto.id ?? sessionDto.Id;
        setSessionId(id);

        // Load lịch sử hội thoại
        try {
          const history = await getChatMessages(id);
          const msgs = (Array.isArray(history) ? history : []).map((m) => ({
            id: m.id ?? m.Id,
            role: (m.role ?? m.Role ?? "assistant").toLowerCase(),
            content: m.content ?? m.Content ?? "",
            citations: m.citations ?? m.Citations ?? [],
            isGeneral: detectGeneral(m.content ?? m.Content ?? "", m.citations ?? m.Citations ?? []),
          }));
          setMessages(msgs);
        } catch {
          // Lịch sử lỗi → không block, chỉ bắt đầu fresh
        }
      })
      .catch((err) => {
        const { errorMessage } = resolveApiError(err);
        setBanner({ type: "error", text: errorMessage || "Không thể khởi tạo trợ lý AI." });
      })
      .finally(() => setInitLoading(false));
  }, [open, courseId, sessionId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Focus input khi mở
  useEffect(() => {
    if (open && !initLoading) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, initLoading]);

  // ─────────────────────────────────────────────
  // Gửi câu hỏi (Step 3-7)
  // ─────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = question.trim();
    if (!text || !sessionId || sending) return;

    setBanner(null);
    setQuestion("");
    setSending(true);

    // Optimistic user bubble
    const userMsgId = "u_" + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: text, citations: [] }]);

    try {
      const data = await askQuestion(sessionId, text);

      if (data.status === "QuotaExceeded") {
        // AF-01 — hết token
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        setQuestion(text);
        setBanner({ type: "error", text: data.warningMessage || "Hạn mức AI Token đã hết. Vui lòng nâng cấp gói để tiếp tục." });
        return;
      }

      const citations    = data.citations ?? data.Citations ?? [];
      const isGeneral    = detectGeneral(data.answer ?? "", citations);

      setMessages((prev) => [
        ...prev,
        {
          id:         data.messageId ?? data.MessageId ?? Date.now() + "_ai",
          role:       "assistant",
          content:    data.answer ?? data.Answer ?? "",
          citations,
          isGeneral,
        },
      ]);

      if (data.warningMessage) {
        setBanner({ type: "warn", text: data.warningMessage });
      }
    } catch (err) {
      // AF-03 — AI service lỗi
      const { errorMessage } = resolveApiError(err);
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      setQuestion(text);
      setBanner({ type: "error", text: errorMessage || "AI tạm thời không phản hồi. Vui lòng thử lại." });
    } finally {
      setSending(false);
    }
  }, [question, sessionId, sending]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  // AF-04 / BR-05: phát hiện câu trả lời dùng general knowledge
  // (citations rỗng hoặc similarityScore thấp)
  function detectGeneral(answer, citations) {
    if (!citations || citations.length === 0) return true;
    const maxScore = Math.max(...citations.map((c) => c.similarityScore ?? c.SimilarityScore ?? 0));
    return maxScore < 0.3;
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <>
      {/* Floating button */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Trợ lý học tập AI"
        aria-label="Mở trợ lý học tập AI"
      >
        <i className={`fas ${open ? "fa-times" : "fa-robot"}`} />
      </button>

      {/* Chat panel */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Trợ lý học tập AI">
          {/* Header */}
          <div className={styles.header}>
            <i className={`fas fa-robot ${styles.headerIcon}`} />
            <div>
              <p className={styles.headerTitle}>Trợ lý học tập AI</p>
              <p className={styles.headerSub}>Hỏi bất cứ điều gì về khóa học</p>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Đóng">
              <i className="fas fa-times" />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {initLoading ? (
              <div className={styles.initLoading}>
                <span className={styles.spinnerSm} /> Đang khởi tạo trợ lý...
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-comments" />
                <p>Hỏi tôi bất cứ điều gì về nội dung khóa học này!</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className={styles.msgUser}>
                      <p className={`${styles.msgLabel} ${styles.msgLabelRight}`}>Bạn</p>
                      <div className={styles.bubbleUser}>{msg.content}</div>
                    </div>
                  );
                }

                const citations = msg.citations ?? [];
                return (
                  <div key={msg.id} className={styles.msgAi}>
                    <p className={styles.msgLabel}>Trợ lý AI</p>
                    <div className={styles.bubbleAi}>{msg.content}</div>

                    {/* Citations — BR-04 ưu tiên nội dung course */}
                    {citations.length > 0 && (
                      <div className={styles.citations}>
                        {citations.map((c, i) => (
                          <span key={i} className={styles.citation}>
                            <i className="fas fa-book-open" />
                            {c.materialTitle ?? c.MaterialTitle ?? `Bài học ${i + 1}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AF-04 / BR-05: thông báo dùng general knowledge */}
                    {msg.isGeneral && (
                      <p className={styles.generalNote}>
                        <i className="fas fa-circle-info" />
                        Câu trả lời này dựa trên kiến thức chung, không từ tài liệu khóa học.
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {sending && (
              <div className={styles.msgAi}>
                <p className={styles.msgLabel}>Trợ lý AI</p>
                <div className={styles.typingBubble}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Banner */}
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
              className={styles.input}
              rows={1}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setBanner(null);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về nội dung khóa học... (Enter để gửi)"
              disabled={sending || initLoading || !sessionId}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={sending || initLoading || !sessionId || !question.trim()}
            >
              {sending
                ? <i className="fas fa-spinner fa-spin" />
                : <i className="fas fa-paper-plane" />}
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
