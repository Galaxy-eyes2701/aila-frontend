import styles from "../Quiz.module.css";

/**
 * Một câu hỏi. SingleChoice → radio (chọn 1); MultipleChoice → checkbox (chọn nhiều).
 * Controlled qua `selectedOptionIds` (mảng); `onChange(questionId, newIds)`.
 */
export default function QuestionCard({
  question,
  index,
  selectedOptionIds = [],
  onChange,
  disabled,
}) {
  const options = [...(question.options || [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
  const isMulti = question.questionType === "MultipleChoice";
  const answered = selectedOptionIds.length > 0;
  const groupName = `q-${question.questionId}`;

  const handleSelect = (optionId) => {
    if (disabled) return;
    if (isMulti) {
      // Toggle trong mảng
      const next = selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter((id) => id !== optionId)
        : [...selectedOptionIds, optionId];
      onChange(question.questionId, next);
    } else {
      onChange(question.questionId, [optionId]);
    }
  };

  return (
    <fieldset className={styles.questionCard}>
      <legend className={styles.questionHead}>
        <span
          className={`${styles.questionNumber} ${
            answered ? styles.questionNumberDone : ""
          }`}
          aria-hidden="true"
        >
          {answered ? <i className="fas fa-check" /> : index + 1}
        </span>
        <span className={styles.questionContent}>
          <span className="sr-only">Câu {index + 1}: </span>
          {question.content}
          <span className={styles.questionHint}>
            {isMulti ? "Chọn một hoặc nhiều đáp án" : "Chọn một đáp án"}
          </span>
        </span>
      </legend>

      <div className={styles.optionList}>
        {options.map((opt) => {
          const checked = selectedOptionIds.includes(opt.optionId);
          return (
            <label
              key={opt.optionId}
              className={`${styles.option} ${
                checked ? styles.optionSelected : ""
              } ${disabled ? styles.optionDisabled : ""}`}
            >
              <input
                type={isMulti ? "checkbox" : "radio"}
                name={groupName}
                value={opt.optionId}
                checked={checked}
                disabled={disabled}
                onChange={() => handleSelect(opt.optionId)}
              />
              <span className={styles.optionText}>{opt.content}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
