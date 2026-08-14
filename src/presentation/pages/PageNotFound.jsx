import { useNavigate } from "react-router-dom";
import useAuth from "@state/hooks/useAuth";

export default function PageNotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role || localStorage.getItem("role");
  let homePath = "/";
  if (role === "Admin" || localStorage.getItem("adminLoggedIn") === "true") {
    homePath = "/admin";
  } else if (role === "Expert") {
    homePath = "/expert";
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8fafc",
      color: "#0f172a",
      padding: "24px",
      textAlign: "center",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "40px 32px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          fontSize: "64px",
          fontWeight: 900,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          marginBottom: "16px"
        }}>
          404
        </div>
        <h1 style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "12px"
        }}>
          Không tìm thấy trang
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#64748b",
          lineHeight: "1.6",
          marginBottom: "28px"
        }}>
          Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn chưa chính xác.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-arrow-left" /> Quay lại
          </button>
          <button
            onClick={() => navigate(homePath)}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-house" /> Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
