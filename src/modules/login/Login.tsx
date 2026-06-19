/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth } from "../const/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import liff from "@line/liff";
import { postUsersSync } from "../api/api_login";
import { setToken } from "../../shared/infra/auth/token";
import LoadingScreen from "./components/LoadingScreen";

interface LoginProps {
  setUser: (user: any) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView] = useState(true);
  const [error, setError] = useState(""); // 🌟 ตัวนี้จะได้ใช้งานแล้วครับ
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLiffState = async () => {
      try {
        // รอให้ liff.init() (ที่น่าจะถูกเรียกจาก App.tsx) ทำงานเสร็จก่อน
        await liff.ready;

        if (liff.isLoggedIn()) {
          // ถ้าล็อกอินค้างไว้อยู่แล้ว หรือเปิดจากใน LINE App ให้ redirect ไปเลย ไม่ต้องให้ผู้ใช้กดปุ่มซ้ำ
          window.location.href = "/";
          return;
        }
      } catch (err) {
        console.error("LIFF Ready Error:", err);
        setError("ไม่สามารถเชื่อมต่อระบบ LINE ได้ กรุณารีเฟรชหน้าจอ");
      } finally {
        // LIFF ตื่นเต็มที่แล้ว (และไม่ได้ล็อกอินอยู่) ถึงจะยอมให้ปิดหน้าโหลด และโชว์ปุ่ม Login
        setIsLoading(false); 
      }
    };

    checkLiffState();
  }, []);

  // --- Login ด้วย Email/Pass ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // เคลียร์ error เก่าก่อนเริ่มทำงานใหม่
    try {
      const userCredential = isLoginView
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;
      const idToken = await user.getIdToken(true);
      setToken(idToken, 24);

      // 🌟 1. สร้าง Payload ไปยิง API (ยังไม่ใส่ role)
      const payload = {
        uid: user.uid,
        email: user.email,
        provider: "email",
      };
      
      // 🌟 2. ยิง API และรอรับ Response กลับมาเพื่อเอา Role
      const syncRes = await postUsersSync(payload);
      let actualRole = "user"; // ให้ user เป็นค่าเริ่มต้นเผื่อ API พัง
      
      if (syncRes.ok) {
        const resData = await syncRes.json();
        // 🎯 ดึง role จาก Backend (รองรับทั้งแบบ resData.role และ resData.data.role)
        actualRole = resData.data?.role || resData?.role || "user";
      }

      // 🌟 3. ประกอบร่าง User ใหม่โดยใช้ Role จาก API จริงๆ
      const updatedUser = {
        ...payload,
        role: actualRole, 
      };

      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError(""); // เคลียร์ error เก่า
    const provider = new FacebookAuthProvider();
    provider.addScope("public_profile");
    provider.addScope("email");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 🌟 1. ดึง Access Token ของ Facebook เพื่อเอาไปยิง Graph API ขอรูปภาพขนาดชัดๆ แบบใน App.tsx
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      let fbName = user.displayName || "";
      let fbPic = user.photoURL || "";

      if (token) {
        try {
          const response = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture.width(500).height(500)&access_token=${token}`,
          );
          const data = await response.json();
          if (data?.name) fbName = data.name;
          if (data?.picture?.data?.url) fbPic = data.picture.data.url;
        } catch (fetchErr) {
          console.error("Error fetching Facebook Graph API:", fetchErr);
        }
      }

      // 🌟 2. เพิ่ม displayName และ photoURL เข้าไปใน Payload เพื่อส่งไปที่ Backend
      const payload = {
        uid: user.uid,
        email: user.email,
        displayName: fbName,
        photoURL: fbPic,
        provider: "facebook",
      };
      
      // ส่งไป sync ที่ backend พร้อมข้อมูลชื่อและรูปภาพ
      const syncRes = await postUsersSync(payload);
      let actualRole = "user";
      
      if (syncRes.ok) {
        const resData = await syncRes.json();
        actualRole = resData.data?.role || resData?.role || "user";
      }

      // 🌟 3. ประกอบร่าง User Object ให้มีข้อมูลครบถ้วนก่อนบันทึกใช้งานในระบบ
      const updatedUser = {
        ...payload,
        role: actualRole,
      };

      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err: any) {
      console.error("Facebook Login Error:", err);
      setError("ไม่สามารถเข้าสู่ระบบผ่าน Facebook ได้");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Login ด้วย LINE (ปุ่มหลัก) ---
  const handleLineLogin = async () => {
    setIsLoading(true);
    setError(""); // เคลียร์ error เก่า
    try {
      // ตรวจสอบว่า LIFF พร้อมหรือยัง
      if (!liff.isLoggedIn()) {
        // 🌟 แก้ไขจุดที่ 1: เปลี่ยนเป้าหมายกลับไปที่หน้าแรกสุด (Root URL) เสมอ
        const cleanUrl = window.location.origin + window.location.pathname;
        liff.login({ redirectUri: cleanUrl });
      } else {
        // 🌟 แก้ไขจุดที่ 2: ถ้า LIFF บอกว่าล็อกอินค้างไว้อยู่แล้ว 
        window.location.href = "/";
      }
    } catch (err) {
      console.error("LINE Login Error:", err);
      setIsLoading(false);
      setError("ไม่สามารถเข้าสู่ระบบผ่าน LINE ได้");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          เข้าสู่ระบบ
        </h2>

        {/* 🌟 เพิ่มกล่องแสดง Error Message ตรงนี้ครับ จะแสดงก็ต่อเมื่อตัวแปร error มีข้อความอยู่ */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingScreen message="กำลังเชื่อมต่อ LINE..." />
        ) : (
          <div className="flex flex-col gap-4">
            {/* ปุ่ม LINE เป็นพระเอก */}
            <button
              onClick={handleLineLogin}
              className="w-full py-4 bg-[#06C755] hover:bg-[#05b34d] text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-lg"
            >
              เข้าสู่ระบบด้วย LINE
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="mx-4 text-gray-400 text-sm">หรือ</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* ส่วน Email เดิม */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
              />
              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
              />
              <button className="w-full py-3 bg-gray-800 text-white rounded-lg">
                เข้าสู่ระบบด้วยอีเมล
              </button>

              <button
                type="button" // 🌟 แนะนำให้ใส่ type="button" เพื่อไม่ให้มันเผลอ trigger form submit
                onClick={handleFacebookLogin}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
              >
                เข้าสู่ระบบด้วย Facebook
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}