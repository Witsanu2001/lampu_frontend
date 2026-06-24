// src/shared/components/LoadingScreen.tsx
interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "กำลังเชื่อมต่อ...",
}: LoadingScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh" /* ให้แสดงผลกลางหน้าจอพอดี */,
        width: "100%",
      }}
    >
      {/* 🟢 ส่วนของ Spinner หมุนๆ (ใช้สีเขียวแบบ LINE) */}
      <svg
        style={{
          animation: "spin 1s linear infinite",
          width: "48px",
          height: "48px",
          color: "#06C755",
        }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          style={{ opacity: 0.2 }}
        ></circle>
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          style={{ opacity: 0.8 }}
        ></path>
      </svg>

      {/* 💬 ส่วนของข้อความ */}
      <p
        style={{
          marginTop: "16px",
          fontSize: "16px",
          color: "#555",
          fontWeight: "500",
        }}
      >
        {message}
      </p>

      {/* ⚙️ แทรก CSS Animation สำหรับคนที่ไม่ได้ใช้ Tailwind */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
