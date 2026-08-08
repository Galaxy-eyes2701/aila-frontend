// LearningView.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../utils/api";
import LearningHeader from "./LearningHeader";
import LearningSidebar from "./LearningSidebar";
import LearningContent from "./LearningContent";
import AIChatWidget from "./AIChatWidget";
import styles from "./LearningView.module.css";

/* ── Skeleton Loading ────────────────────────────────────────────────────── */
function LearningSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonSidebar}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.skeletonRow} />
        ))}
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonBody} />
      </div>
    </div>
  );
}

/* ── Component Chính ─────────────────────────────────────────────────────── */
export default function LearningView() {
  const { courseId } = useParams();
  const [learningViewData, setLearningViewData] = useState(null); // Lưu lộ trình (Progress + Modules)
  const [currentMaterial, setCurrentMaterial] = useState(null); // Lưu chi tiết bài học đang xem
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Khởi tạo và tải dữ liệu lộ trình tổng quan của khóa học
  useEffect(() => {
    const fetchCourseLearningView = async () => {
      try {
        const res = await api.get(`/Courses/${courseId}/learning-view`);
        if (res.data.success) {
          const data = res.data.data;

          // Đồng bộ và chuẩn hóa dữ liệu từ Backend (Hỗ trợ cả CamelCase và PascalCase)
          const normalizedProgress = data.progress || data.Progress;
          const normalizedModules = data.modules || data.Modules || [];

          const preparedData = {
            progress: normalizedProgress,
            modules: normalizedModules,
          };

          setLearningViewData(preparedData);

          // Xác định bài học cần tải lúc ban đầu
          const targetMaterialId = normalizedProgress?.currentMaterialId;

          if (targetMaterialId) {
            fetchMaterialDetail(targetMaterialId, normalizedModules);
          } else {
            // Trường hợp dự phòng (Fallback): Chọn bài đầu tiên của chương đầu tiên
            const sortedModules = [...normalizedModules].sort(
              (a, b) => a.orderIndex - b.orderIndex,
            );
            const firstModule = sortedModules[0];
            if (firstModule && firstModule.materials?.length > 0) {
              const sortedMaterials = [...firstModule.materials].sort(
                (a, b) => a.orderIndex - b.orderIndex,
              );
              fetchMaterialDetail(sortedMaterials[0].id, normalizedModules);
            }
          }
        } else {
          setError("Không thể tải nội dung lộ trình khóa học.");
        }
      } catch {
        setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra và thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseLearningView();
  }, [courseId]);

  // 2. Hàm tải thông tin chi tiết của học liệu được chọn
  const fetchMaterialDetail = async (
    materialId,
    currentModules = learningViewData?.modules,
  ) => {
    setContentLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/Materials/${materialId}`);
      if (res.data.success) {
        const detailData = res.data.data;

        // Tìm kiếm trạng thái hoàn thành (isCompleted) từ danh sách tổng quan
        let isCompleted = false;
        if (currentModules) {
          for (const mod of currentModules) {
            const matched = mod.materials?.find((m) => m.id === materialId);
            if (matched) {
              isCompleted = matched.isCompleted;
              break;
            }
          }
        }

        setCurrentMaterial({ ...detailData, isCompleted });
      } else {
        alert("Không thể tải chi tiết nội dung học liệu.");
      }
    } catch {
      alert("Lỗi đường truyền mạng khi tải bài học.");
    } finally {
      setContentLoading(false);
    }
  };

  // 3. Hàm kích hoạt API đánh dấu hoàn thành học liệu (Bấm tay hoặc tự động)
  const handleCompleteMaterial = async () => {
    if (!currentMaterial) return;
    try {
      const res = await api.post(
        `/courses/${courseId}/Materials/${currentMaterial.id}/complete`,
      );
      if (res.data.success) {
        // Cập nhật State tức thời cho màn hình hiển thị chính
        setCurrentMaterial((prev) => ({ ...prev, isCompleted: true }));

        // Cập nhật lại cây danh sách bên Sidebar và thanh Progress Header
        setLearningViewData((prev) => {
          if (!prev) return prev;

          const updatedModules = prev.modules.map((mod) => ({
            ...mod,
            materials: mod.materials.map((m) =>
              m.id === currentMaterial.id ? { ...m, isCompleted: true } : m,
            ),
          }));

          const isAlreadyCompleted = prev.modules
            .flatMap((m) => m.materials)
            .find((m) => m.id === currentMaterial.id)?.isCompleted;

          const newCompletedCount = isAlreadyCompleted
            ? prev.progress.completedMaterials
            : prev.progress.completedMaterials + 1;

          const newPercent =
            prev.progress.totalMaterials > 0
              ? (newCompletedCount / prev.progress.totalMaterials) * 100
              : 0;

          return {
            ...prev,
            progress: {
              ...prev.progress,
              completedMaterials: newCompletedCount,
              percent: Math.round(newPercent * 10) / 10,
            },
            modules: updatedModules,
          };
        });
      }
    } catch {
      console.error(
        "Gặp lỗi trong quá trình tự động cập nhật tiến độ lên máy chủ.",
      );
    }
  };

  // 4. Tìm ID bài học tiếp theo dựa vào sơ đồ orderIndex
  const getNextLessonId = () => {
    if (!learningViewData || !currentMaterial) return null;
    const { modules } = learningViewData;

    const currentModule = modules.find(
      (m) => m.id === currentMaterial.moduleId,
    );
    if (!currentModule) return null;

    // Tìm bài có thứ tự lớn hơn bài hiện tại trong cùng chương
    const nextInModule = currentModule.materials
      ?.filter((m) => m.orderIndex > currentMaterial.orderIndex)
      ?.sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (nextInModule) return nextInModule.id;

    // Nếu đã hết bài trong chương hiện tại, tìm sang bài đầu tiên của chương tiếp theo
    const nextModule = modules
      ?.filter((m) => m.orderIndex > currentModule.orderIndex)
      ?.sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (nextModule && nextModule.materials?.length > 0) {
      const sortedNextMaterials = [...nextModule.materials].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      return sortedNextMaterials[0].id;
    }
    return null;
  };

  const nextLessonId = getNextLessonId();

  if (loading) {
    return (
      <div className="container" style={{ padding: "24px 0" }}>
        <LearningSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <i className="fas fa-exclamation-triangle" />
        </div>
        <p className={styles.emptyTitle}>Lỗi kết nối</p>
        <p className={styles.emptyDesc}>{error}</p>
        <Link to="/courses" className={styles.backBtn}>
          Quay lại danh sách khóa học
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Thanh công cụ thông tin tiến trình khóa học */}
      <LearningHeader
        courseId={courseId}
        progress={learningViewData?.progress}
      />

      <div className={styles.mainContainer}>
        {/* Thanh điều hướng bài học bên trái */}
        <LearningSidebar
          modules={learningViewData?.modules}
          currentMaterialId={currentMaterial?.id}
          onSelectMaterial={(id) => fetchMaterialDetail(id)}
        />

        {/* Khu vực phân tách định dạng hiển thị học liệu */}
        <LearningContent
          contentLoading={contentLoading}
          currentMaterial={currentMaterial}
          enrollmentId={learningViewData?.progress?.enrollmentId}
          onComplete={handleCompleteMaterial}
          hasNextLesson={!!nextLessonId}
          onNextLesson={async () => {
            // ĐÃ PHÁT TRIỂN: Tự động hoàn thành tài liệu văn bản khi bấm chuyển tiếp
            const isDocument = currentMaterial?.materialType
              ?.toLowerCase()
              .includes("document");
            const isNotCompletedYet = !currentMaterial?.isCompleted;

            if (isDocument && isNotCompletedYet) {
              await handleCompleteMaterial(); // Đợi API complete lưu xong tiến độ bài cũ
            }

            // Chuyển màn hình sang bài học mới
            fetchMaterialDetail(nextLessonId);
          }}
        />
      </div>

      {/* UC-31 — AI Learning Assistant floating widget */}
      <AIChatWidget courseId={courseId} />
    </div>
  );
}
