import styles from "../LearningProfile.module.css";

/**
 * Thanh tìm kiếm + nhóm chip lọc dùng chung cho 3 màn "Xem tất cả".
 * `options`: [{ value, label, count }] — count là số bản ghi khớp từ khóa hiện tại.
 */
export default function FilterBar({
  keyword,
  onKeywordChange,
  placeholder,
  options,
  activeFilter,
  onFilterChange,
  filterLabel = "Bộ lọc",
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.searchBox}>
        <i className={`fas fa-magnifying-glass ${styles.searchIcon}`} />
        <input
          className={styles.searchInput}
          type="text"
          value={keyword}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
        {keyword && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => onKeywordChange("")}
            aria-label="Xóa từ khóa"
          >
            <i className="fas fa-xmark" />
          </button>
        )}
      </div>

      <div className={styles.chipGroup} role="group" aria-label={filterLabel}>
        {options.map((opt) => {
          const active = opt.value === activeFilter;
          return (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${active ? styles.chipActive : ""}`}
              aria-pressed={active}
              onClick={() => onFilterChange(opt.value)}
            >
              {opt.label}
              <span className={styles.chipCount}>{opt.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
