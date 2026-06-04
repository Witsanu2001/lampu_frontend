/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { auth, facebookProvider } from "../const/firebase"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, FacebookAuthProvider, updateProfile } from "firebase/auth"; // 🌟 เปลี่ยนมาอิมพอร์ต signInWithPopup
import liff from "@line/liff";

interface LoginProps {
  setUser: (user: any) => void; // 🌟 รับ type setUser เข้ามา
}

export default function Login({ setUser }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFacebookLogin = async () => {
    setError("");
    try {
      facebookProvider.addScope("public_profile");
      
      // 🌟 1. ล็อกอินด้วย Popup
      const result = await signInWithPopup(auth, facebookProvider);
      
      // 🌟 2. ดึงข้อมูลพิกัดรูปภาพระดับ HD
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        const response = await fetch(`https://graph.facebook.com/me?fields=picture.width(500).height(500)&access_token=${token}`);
        const data = await response.json();
        
        if (data?.picture?.data) {
          const realPicUrl = data.picture.data.url;
          await updateProfile(result.user, { photoURL: realPicUrl });
          
          // จัดรูปแบบข้อมูลสำหรับเซฟลง State และส่งไปให้ Backend
          const updatedUser = {
            uid: result.user.uid,
            email: result.user.email || "", // บางครั้ง Facebook ไม่ส่ง Email มาให้
            displayName: result.user.displayName || "ผู้ใช้ใหม่",
            photoURL: realPicUrl || "",
            provider: "facebook",
          };
          
          // บันทึกลง State ของ React และ LocalStorage
          setUser(updatedUser);
          localStorage.setItem("userData", JSON.stringify(updatedUser));

          // 🌟 3. ยิงข้อมูลไปหา API Gateway (เพื่อส่งต่อไปเซฟใน Firestore)
          try {
            // ขอ Token จาก Firebase (เอาไว้ให้ Gateway ตรวจสอบความปลอดภัย)
            const idToken = await result.user.getIdToken(true); 
            
            const syncResponse = await fetch("https://api-gateway-879165280409.asia-southeast1.run.app/api/users/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}` // ส่งไปใน Header
              },
              body: JSON.stringify(updatedUser) // ส่งข้อมูลโปรไฟล์ไปด้วย
            });

            if (syncResponse.ok) {
              const resData = await syncResponse.json();
              console.log("✅ ยิง API สำเร็จ! ตอบกลับจากเซิร์ฟเวอร์:", resData);
            } else {
              console.error("❌ ยิง API ไม่สำเร็จ สถานะ:", syncResponse.status);
            }
          } catch (apiErr) {
            console.error("❌ เกิดข้อผิดพลาดในการเรียก API Gateway:", apiErr);
          }

        }
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message);
      }
    }
  };

  const handleLineLogin = () => {
    if (!liff.isLoggedIn()) liff.login();
  };

  return (
    <div id="center" style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ background: "var(--bg)", padding: "40px", borderRadius: "12px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
          {isLoginView ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--code-bg)", color: "var(--text-h)" }} />
          <input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--code-bg)", color: "var(--text-h)" }} />
          {error && <div style={{ color: "#ef4444", fontSize: "14px", textAlign: "center" }}>{error}</div>}
          <button type="submit" style={{ padding: "12px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" }}>
            {isLoginView ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
          <span style={{ margin: "0 10px", color: "var(--text)", fontSize: "14px" }}>หรือ</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
        </div>

        <button onClick={handleLineLogin} type="button" style={{ width: "100%", padding: "12px", background: "#06C755", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          ดำเนินการต่อด้วย LINE
        </button>
        <button onClick={handleFacebookLogin} type="button" style={{ width: "100%", padding: "12px", background: "#1877F2", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          ดำเนินการต่อด้วย Facebook
        </button>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button type="button" onClick={() => { setIsLoginView(!isLoginView); setError(""); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>
            {isLoginView ? "ยังไม่มีบัญชีใช่ไหม? สมัครเลย" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
}