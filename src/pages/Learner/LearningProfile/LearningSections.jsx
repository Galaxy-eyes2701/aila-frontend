import { Link } from "react-router-dom";
import SummaryStats from "./components/SummaryStats";
import CourseCard from "./components/CourseCard";
import QuizHistoryRow from "./components/QuizHistoryRow";
import AiScenarioRow from "./components/AiScenarioRow";
import styles from "./LearningProfile.module.css";

function EmptyBlock({ icon, title, desc, primary }) {
  return (
    <div className={styles.blockState}>
      <div className={`${styles.blockIcon} ${primary ? styles.blockIconPrimary : ""}`}>
        <i className={`fas ${icon}`} />
      </div>
      <p className={styles.blockTitle}>{title}</p>
      {desc && <p className={styles.blockDesc}>{desc}</p>}
    </div>
  );
}

/**
 * Các khối học tập UC-30 nhúng vào /profile — thứ tự cố định (AC-3):
 * Tổng quan → Khóa học → Lịch sử quiz → Lịch sử AI scenario.
 */
export default function LearningSections({ profile }) {
  const { summary } = profile;
  const enrollments = profile.enrollments || [];
  const quizHistory = profile.quizHistory || [];
  const aiScenarioHistory = profile.aiScenarioHistory || [];

  const allEmpty =
    enrollments.length === 0 &&
    quizHistory.length === 0 &&
    aiScenarioHistory.length === 0;

  return (
    <>
      {/* ── Tổng quan ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-chart-simple" /> Tổng quan
          </h2>
          <Link to="/profile/subscription-usage" className={styles.viewAll}>
            <i className="fas fa-bolt" /> Xem sử dụng tài nguyên <i className="fas fa-arrow-right" />
          </Link>
        </div>
        <SummaryStats summary={summary} aiScenarioCount={aiScenarioHistory.length} />
        {/* UC-18 — link gói đăng ký */}
        <div style={{ marginTop: 12 }}>
          <Link to="/profile/subscription"
            style={{ fontSize: 13, color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="fas fa-gem" /> Xem gói đăng ký hiện tại
          </Link>
          <span style={{ margin: "0 10px", color: "var(--border)" }}>|</span>
          <Link to="/profile/payment-history"
            style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="fas fa-receipt" /> Lịch sử thanh toán
          </Link>
        </div>
      </section>

      {allEmpty ? (
        /* ── Empty toàn trang (AC-6) ── */
        <div className={styles.section}>
          <div className={styles.blockState}>
            <div className={`${styles.blockIcon} ${styles.blockIconPrimary}`}>
              <i className="fas fa-book-open-reader" />
            </div>
            <p className={styles.blockTitle}>
              Bạn chưa tham gia hoạt động học tập nào.
            </p>
            <p className={styles.blockDesc}>
              Khám phá các khóa học để bắt đầu hành trình của bạn!
            </p>
            <Link to="/courses" className={styles.exploreBtn}>
              <i className="fas fa-compass" /> Khám phá khóa học
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Khóa học đã tham gia ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-book-open" /> Khóa học đã tham gia
              </h2>
              {summary.totalCourses > enrollments.length && (
                <Link to="/profile/courses" className={styles.viewAll}>
                  Xem tất cả ({summary.totalCourses}) <i className="fas fa-arrow-right" />
                </Link>
              )}
            </div>
            {enrollments.length > 0 ? (
              <div className={styles.courseGrid}>
                {enrollments.slice(0, 5).map((en) => (
                  <CourseCard key={en.courseId} enrollment={en} />
                ))}
              </div>
            ) : (
              <EmptyBlock icon="fa-book" title="Bạn chưa tham gia khóa học nào." />
            )}
          </section>

          {/* ── Lịch sử quiz ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-clipboard-check" /> Lịch sử quiz đã làm
              </h2>
              {summary.totalQuizzesTaken > quizHistory.length && (
                <Link to="/profile/quiz-history" className={styles.viewAll}>
                  Xem tất cả ({summary.totalQuizzesTaken}){" "}
                  <i className="fas fa-arrow-right" />
                </Link>
              )}
            </div>
            {quizHistory.length > 0 ? (
              <div className={styles.quizList}>
                {quizHistory.slice(0, 5).map((q) => (
                  <QuizHistoryRow key={q.attemptId} item={q} />
                ))}
              </div>
            ) : (
              <EmptyBlock icon="fa-clipboard" title="Bạn chưa làm bài quiz nào." />
            )}
          </section>

          {/* ── Lịch sử AI scenario ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-robot" /> Lịch sử AI scenario
              </h2>
            </div>
            {aiScenarioHistory.length > 0 ? (
              <div className={styles.quizList}>
                {aiScenarioHistory.slice(0, 5).map((a) => (
                  <AiScenarioRow key={a.materialId} item={a} />
                ))}
              </div>
            ) : (
              <EmptyBlock
                primary
                icon="fa-robot"
                title="Chưa có lượt luyện AI scenario nào."
                desc="Khi bạn luyện tập, lịch sử sẽ xuất hiện tại đây."
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
