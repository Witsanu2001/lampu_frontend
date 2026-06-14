/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
  const [, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Login ด้วย Email/Pass ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = isLoginView
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;
      const idToken = await user.getIdToken(true);
      setToken(idToken, 24);

      // (Logic เดิมในการ Sync ข้อมูลของคุณ)
      const updatedUser = {
        uid: user.uid,
        email: user.email,
        role: "user",
        provider: "email",
      };
      await postUsersSync(updatedUser);
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
    const provider = new FacebookAuthProvider();
    provider.addScope("public_profile");
    provider.addScope("email");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // หลังจาก login สำเร็จ ส่งไป sync ที่ backend เหมือนเดิม
      const updatedUser = {
        uid: user.uid,
        email: user.email,
        role: "user",
        provider: "facebook",
      };
      await postUsersSync(updatedUser);
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
    try {
      // ตรวจสอบว่า LIFF พร้อมหรือยัง
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
      } else {
        // ถ้าล็อกอินอยู่แล้ว ให้รีเฟรชหน้าเพื่อไปรัน logic ใน App.tsx ใหม่
        window.location.reload();
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
