import { useRef, useState } from "react";
import styles from "./LearningMaterial.module.css";
import quizStyles from "./Quiz.module.css";
import {
  downloadImportTemplate,
  previewImportQuestions,
  confirmImportQuestions,
  resolveApiError,
} from "@services/expertQuizApi";

// ── Bước hiện tại của wizard ─────────────────────────────────
// "upload"  → chọn file & download template
// "review"  → xem kết quả preview
// "done"    → kết quả lưu DB thành công
const STEP = { UPLOAD: "upload", REVIEW: "review", DONE: "done" };

export default function QuestionImportModal({ open, quizMaterialId, onClose, onImported }) {
  const fileInputRef = useRef(null);

  const [step, setStep]               = useState(STEP.UPLOAD);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);   // QuestionImportResultDto
  const [importResult, setImportResult] = useState(null); // QuestionImportResultDto sau confirm

  const [downloading, setDownloading] = useState(false);
  const [previewing,  setPreviewing]  = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [error,       setError]       = useState("");

  // ── Reset toàn bộ state khi đóng/mở lại ─────────────────────
  function handleClose() {
    setStep(STEP.UPLOAD);
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  // ── Download template ────────────────────────────────────────
  async function handleDownloadTemplate() {
    try {
      setDownloading(true);
      setError("");
      const response = await downloadImportTemplate(quizMaterialId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "question_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const apiMsg = err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg ?? "Không thể tải template.");
    } finally {
      setDownloading(false);
    }
  }

  // ── Chọn file ────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError("");
  }

  // ── Preview (dryRun) ─────────────────────────────────────────
  async function handlePreview() {
    if (!selectedFile) {
      setError("Vui lòng chọn file .xlsx trước.");
      return;
    }
    if (!selectedFile.name.endsWith(".xlsx")) {
      setError("Chỉ chấp nhận file .xlsx");
      return;
    }

    try {
      setPreviewing(true);
      setError("");
      const res = await previewImportQuestions(quizMaterialId, selectedFile);
      if (!res.success) {
        setError(res.errorMessage ?? "Không thể preview file.");
        return;
      }
      setPreviewData(res.data);
      setStep(STEP.REVIEW);
    } catch (err) {
      const apiMsg = err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg ?? "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setPreviewing(false);
    }
  }

  // ── Confirm import ───────────────────────────────────────────
  async function handleConfirm() {
    if (!selectedFile) return;
    try {
      setConfirming(true);
      setError("");
      const res = await confirmImportQuestions(quizMaterialId, selectedFile);
      if (!res.success) {
        setError(res.errorMessage || "Import thất bại.");
        return;
      }
      setImportResult(res.data);
      setStep(STEP.DONE);
      onImported?.();
    } catch (err) {
      const apiMsg =
        err.response?.data?.errorMessage || resolveApiError(err).errorMessage;
      setError(apiMsg || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 740 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className={styles.modalHeader}>
          <h2>
            <i className="fas fa-file-import" style={{ marginRight: 8 }} />
            Import câu hỏi từ Excel
          </h2>
          <button type="button" className={styles.closeButton} onClick={handleClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ── Stepper ─────────────────────────────────────────── */}
        <div className={quizStyles.importStepper}>
          <StepBubble num={1} label="Chọn file" active={step === STEP.UPLOAD} done={step !== STEP.UPLOAD} />
          <div className={quizStyles.importStepLine} />
          <StepBubble num={2} label="Xem trước" active={step === STEP.REVIEW} done={step === STEP.DONE} />
          <div className={quizStyles.importStepLine} />
          <StepBubble num={3} label="Hoàn tất"  active={step === STEP.DONE}   done={false} />
        </div>

        {/* ── Bước 1: Upload ─────────────────────────────────── */}
        {step === STEP.UPLOAD && (
          <div className={quizStyles.importBody}>
            {/* Download template */}
            <div className={quizStyles.importTemplateBox}>
              <div className={quizStyles.importTemplateInfo}>
                <i className="fas fa-file-excel" style={{ color: "#16a34a", fontSize: 22 }} />
                <div>
                  <div className={quizStyles.importTemplateTitle}>File mẫu (Template)</div>
                  <div className={quizStyles.importTemplateDesc}>
                    Download file mẫu, điền câu hỏi theo đúng cột rồi upload lên.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleDownloadTemplate}
                disabled={downloading}
              >
                {downloading
                  ? <><i className="fas fa-spinner fa-spin" /> Đang tải...</>
                  : <><i className="fas fa-download" /> Tải template</>}
              </button>
            </div>

            {/* Upload file */}
            <div className={quizStyles.importUploadArea}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) { setSelectedFile(f); setError(""); }
              }}
            >
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: 28, color: "#3b82f6", marginBottom: 8 }} />
              {selectedFile
                ? <><div className={quizStyles.importFileName}><i className="fas fa-file-excel" /> {selectedFile.name}</div>
                    <div className={quizStyles.importFileSize}>{(selectedFile.size / 1024).toFixed(1)} KB</div></>
                : <><div className={quizStyles.importUploadLabel}>Kéo thả hoặc nhấn để chọn file .xlsx</div>
                    <div className={quizStyles.importUploadHint}>Tối đa 10 MB</div></>}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            {error && <ErrorBox message={error} />}

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={handleClose}>
                Hủy
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handlePreview}
                disabled={previewing || !selectedFile}
              >
                {previewing
                  ? <><i className="fas fa-spinner fa-spin" /> Đang xử lý...</>
                  : <><i className="fas fa-search" /> Xem trước</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Bước 2: Review ─────────────────────────────────── */}
        {step === STEP.REVIEW && previewData && (
          <div className={quizStyles.importBody}>
            {/* Stats summary */}
            <div className={quizStyles.importStats}>
              <StatChip icon="fa-list" label="Tổng dòng"   value={previewData.totalRows}   color="gray" />
              <StatChip icon="fa-check-circle" label="Hợp lệ" value={previewData.validRows} color="green" />
              <StatChip icon="fa-times-circle" label="Lỗi"    value={previewData.invalidRows} color="red" />
            </div>

            {previewData.invalidRows > 0 && (
              <div className={quizStyles.importWarning}>
                <i className="fas fa-exclamation-triangle" />
                Có {previewData.invalidRows} dòng lỗi sẽ bị bỏ qua.
                Chỉ {previewData.validRows} dòng hợp lệ được import.
              </div>
            )}

            {/* Bảng review từng dòng */}
            <div className={quizStyles.importReviewTable}>
              <div className={quizStyles.importReviewHeader}>
                <span style={{ width: 50 }}>Dòng</span>
                <span style={{ flex: 1 }}>Nội dung câu hỏi</span>
                <span style={{ width: 110 }}>Loại</span>
                <span style={{ width: 70 }}>Đáp án</span>
                <span style={{ width: 80 }}>Trạng thái</span>
              </div>
              <div className={quizStyles.importReviewBody}>
                {previewData.rows.map(row => (
                  <div
                    key={row.rowNumber}
                    className={`${quizStyles.importReviewRow} ${row.isValid ? "" : quizStyles.importReviewRowError}`}
                  >
                    <span style={{ width: 50, fontWeight: 600, color: "#6b7280" }}>
                      #{row.rowNumber}
                    </span>
                    <span style={{ flex: 1, wordBreak: "break-word" }}>
                      {row.content || <em style={{ color: "#9ca3af" }}>Trống</em>}
                      {!row.isValid && row.errors.length > 0 && (
                        <ul className={quizStyles.importRowErrors}>
                          {row.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                    </span>
                    <span style={{ width: 110 }}>
                      <span className={`${quizStyles.badge} ${
                        row.questionType === "SingleChoice" ? quizStyles.badgeSingle : quizStyles.badgeMultiple
                      }`}>
                        {row.questionType === "SingleChoice" ? "1 đáp án" : "Nhiều đáp án"}
                      </span>
                    </span>
                    <span style={{ width: 70, color: "#6b7280", fontSize: 12 }}>
                      {row.options?.length ?? 0} đáp án
                    </span>
                    <span style={{ width: 80 }}>
                      {row.isValid
                        ? <span className={quizStyles.importStatusValid}><i className="fas fa-check" /> Hợp lệ</span>
                        : <span className={quizStyles.importStatusError}><i className="fas fa-times" /> Lỗi</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => { setStep(STEP.UPLOAD); setError(""); }}
              >
                <i className="fas fa-arrow-left" /> Quay lại
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleConfirm}
                disabled={confirming || previewData.validRows === 0}
                title={previewData.validRows === 0 ? "Không có dòng hợp lệ để import" : ""}
              >
                {confirming
                  ? <><i className="fas fa-spinner fa-spin" /> Đang import...</>
                  : <><i className="fas fa-file-import" /> Import {previewData.validRows} câu hỏi</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Bước 3: Done ───────────────────────────────────── */}
        {step === STEP.DONE && importResult && (
          <div className={quizStyles.importBody}>
            <div className={quizStyles.importDoneBox}>
              <i className="fas fa-circle-check" style={{ fontSize: 40, color: "#16a34a" }} />
              <h3>Import thành công!</h3>
              <p>Đã thêm <strong>{importResult.validRows}</strong> câu hỏi vào quiz.</p>
              {importResult.invalidRows > 0 && (
                <p style={{ color: "#b45309", fontSize: 13 }}>
                  <i className="fas fa-exclamation-triangle" /> {importResult.invalidRows} dòng lỗi đã bị bỏ qua.
                </p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.primaryButton} onClick={handleClose}>
                <i className="fas fa-check" /> Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StepBubble({ num, label, active, done }) {
  return (
    <div className={quizStyles.importStepItem}>
      <div className={`${quizStyles.importStepBubble} ${
        done ? quizStyles.importStepDone : active ? quizStyles.importStepActive : ""
      }`}>
        {done ? <i className="fas fa-check" /> : num}
      </div>
      <span className={quizStyles.importStepLabel}>{label}</span>
    </div>
  );
}

function StatChip({ icon, label, value, color }) {
  const colorMap = {
    gray:  { bg: "#f3f4f6", text: "#374151" },
    green: { bg: "#dcfce7", text: "#15803d" },
    red:   { bg: "#fee2e2", text: "#dc2626" },
  };
  const c = colorMap[color] ?? colorMap.gray;
  return (
    <div className={quizStyles.importStatChip} style={{ background: c.bg, color: c.text }}>
      <i className={`fas ${icon}`} />
      <span className={quizStyles.importStatValue}>{value}</span>
      <span className={quizStyles.importStatLabel}>{label}</span>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className={quizStyles.importErrorBox}>
      <i className="fas fa-circle-exclamation" />
      <span>{message}</span>
    </div>
  );
}
