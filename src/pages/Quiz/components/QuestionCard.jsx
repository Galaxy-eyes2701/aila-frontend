import styles from "../Quiz.module.css";

/**
 * Một câu hỏi với nhóm radio (single choice). Controlled qua selectedOptionId.
 */
export default function QuestionCard({
  question,
  index,
  selectedOptionId,
  onSelect,
  disabled,
}) {
  const options = [...(question.options || [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
  const answered = !!selectedOptionId;
  const groupName = `q-${question.questionId}`;

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
        </span>
      </legend>

      <div className={styles.optionList}>
        {options.map((opt) => {
          const checked = selectedOptionId === opt.optionId;
          return (
            <label
              key={opt.optionId}
              className={`${styles.option} ${
                checked ? styles.optionSelected : ""
              } ${disabled ? styles.optionDisabled : ""}`}
            >
              <input
                type="radio"
                name={groupName}
                value={opt.optionId}
                checked={checked}
                disabled={disabled}
                onChange={() => onSelect(question.questionId, opt.optionId)}
              />
              <span className={styles.optionText}>{opt.content}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
