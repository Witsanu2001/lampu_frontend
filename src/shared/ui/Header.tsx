/* eslint-disable @typescript-eslint/no-explicit-any */
import { signOut } from "firebase/auth";
import { auth } from "../../modules/const/firebase";
import liff from "@line/liff";

interface HeaderProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Header({ user, setUser }: HeaderProps) {
  const handleLogout = async () => {
    if (user?.provider === "line") {
      liff.logout();
    }
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("userData");
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "var(--bg, #ffffff)",
        borderBottom: "1px solid var(--border, #e5e4e7)",
      }}
    >
      {/* ฝั่งซ้าย: โลโก้ หรือ ชื่อระบบ */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "22px" }}>💡</span>
        <strong style={{ fontSize: "18px", color: "var(--text-h)" }}>LAMPU PROJECT</strong>
      </div>

      {/* ฝั่งขวา: ข้อมูลผู้ใช้งาน และ ปุ่ม Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                border: user.provider === "line" ? "2px solid #06C755" : "2px solid var(--accent)",
              }}
            />
          )}
          <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-h)" }}>
            {user?.displayName || "ผู้ใช้งาน"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            background: "var(--code-bg, #f4f3ec)",
            color: "#ef4444",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}