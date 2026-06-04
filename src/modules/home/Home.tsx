/* eslint-disable @typescript-eslint/no-explicit-any */
import { signOut } from "firebase/auth";
import { auth } from "../const/firebase"; // เช็ค path
import liff from "@line/liff";
import { useState } from "react";
// import SelectLocation from "../SelectLocation"; // เช็ค path

interface HomeProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Home({ user, setUser }: HomeProps) {
  // const handleLocationConfirm = (lat: number, lng: number) => {
  //   console.log("ลูกค้าปักหมุดที่:", lat, lng);
  // };

  const handleLogout = async () => {
    if (user?.provider === "line") {
      liff.logout();
    }
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("userData");
  };

  const [backendMessage, setBackendMessage] = useState("");

  const handleTestBackend = async () => {
    // 1. ตรวจสอบว่าล็อกอินอยู่หรือเปล่า
    const user = auth.currentUser;
    if (!user) {
      alert("คุณยังไม่ได้ล็อกอิน!");
      return;
    }

    try {
      // 2. ขอ ID Token ล่าสุดจากผู้ใช้
      const token = await user.getIdToken(true);

      // 3. ยิงไปหา Cloud Run ของเรา พร้อมแนบ Token ไปด้วย
      const response = await fetch(
        "https://api-gateway-879165280409.asia-southeast1.run.app/api/secure-data",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // แนบ Token ใน Header
          },
        },
      );

      if (response.ok) {
        const text = await response.text();
        setBackendMessage(text);
      } else {
        setBackendMessage("Error: ไม่ได้รับอนุญาต (Token อาจจะผิดหรือหมดอายุ)");
      }
    } catch (error) {
      console.error("Error fetching backend:", error);
      setBackendMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div id="center" style={{ minHeight: "100vh", padding: "20px" }}>
      <div
        style={{
          background: "var(--bg)",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
          ยินดีต้อนรับ!
        </h1>

        <button
          onClick={handleTestBackend}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          ทดสอบเชื่อมต่อหลังบ้าน (Go)
        </button>

        {backendMessage && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#f0fdf4",
              color: "#166534",
              borderRadius: "8px",
            }}
          >
            <strong>ตอบกลับจาก Server: </strong> {backendMessage}
          </div>
        )}

        {user.photoURL && (
          <div style={{ marginBottom: "16px" }}>
            <img
              src={user.photoURL}
              alt="Profile"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                objectFit: "cover",
                border:
                  user.provider === "line"
                    ? "3px solid #06C755"
                    : "3px solid var(--accent)",
                boxShadow: "var(--shadow)",
              }}
            />
          </div>
        )}
        <p
          style={{
            color: "var(--text-h)",
            fontWeight: "bold",
            fontSize: "20px",
            margin: "0",
          }}
        >
          {user.displayName || "ผู้ใช้งาน"}
        </p>
        {user.email && (
          <p
            style={{ color: "var(--text)", fontSize: "14px", marginTop: "4px" }}
          >
            {user.email}
          </p>
        )}
        <button
          onClick={handleLogout}
          style={{
            padding: "12px",
            marginTop: "24px",
            cursor: "pointer",
            background: "var(--code-bg)",
            color: "var(--text-h)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
