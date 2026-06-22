/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth } from "../const/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import liff from "@line/liff";
import { postUsersSync } from "../api/api_login";
import { setToken } from "../../shared/infra/auth/token";
import LoadingScreen from "./components/LoadingScreen";
import { getDatabase, onValue, ref } from "firebase/database";

// 🌟 1. สร้างตัวแปรตรวจสอบว่ารันบนเครื่องตัวเอง (Localhost) หรือไม่
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

interface LoginProps {
  setUser: (user: any) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [blockedUid, setBlockedUid] = useState("");

  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const syncUserToRTDB = async (uid: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(
        `http://localhost:8080/api/users/sync_to_live?user_id=${uid}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log("✅ Sync to RTDB success for:", uid);
    } catch (err) {
      console.error("❌ Sync to RTDB failed:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const targetUid = blockedUid || currentUser?.uid;
    if (!targetUid) return;

    const db = getDatabase(auth.app);
    const userRef = ref(db, `live_users/${targetUid}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();

      if (data && (data.is_blocked === false || data.is_blocked === "false")) {
        setIsBlocked(false);
        setBlockMessage("");
        setBlockedUid("");
      }
    });

    return () => unsubscribe();
  }, [currentUser, blockedUid]);

  useEffect(() => {
    const checkLiffState = async () => {
      try {
        await liff.ready;
        if (liff.isLoggedIn()) {
          window.location.href = "/";
          return;
        }
      } catch (err) {
        console.error("LIFF Ready Error:", err);
        setError("ไม่สามารถเชื่อมต่อระบบ LINE ได้ กรุณารีเฟรชหน้าจอ");
      } finally {
        setIsLoading(false);
      }
    };
    checkLiffState();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const userCredential = isLoginView
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;
      const idToken = await user.getIdToken(true);
      setToken(idToken, 24);

      const payload = {
        uid: user.uid,
        email: user.email,
        provider: "email",
      };

      const syncRes = await postUsersSync(payload);

      if (!syncRes.ok) {
        const errData = await syncRes.json().catch(() => ({}));
        if (syncRes.status === 403 || errData.message?.includes("ระงับ")) {
          setBlockMessage(errData.message || "บัญชีของคุณถูกระงับการใช้งาน");
          setIsBlocked(true);
          setBlockedUid(user.uid);
          setIsLoading(false);
          return;
        }
        throw new Error(errData.message || "เซิร์ฟเวอร์เกิดข้อผิดพลาด");
      }

      await syncUserToRTDB(user.uid);

      // 🌟 2. ดึง Role จาก API ตอนล็อกอินเข้าครั้งแรก
      const resData = await syncRes.json();
      const actualRole = resData.data?.role || resData?.role || "user";

      const updatedUser = {
        ...payload,
        role: actualRole,
      };

      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err: any) {
      if (err.code === "auth/user-disabled") {
        setBlockMessage("บัญชีของคุณถูกระงับการใช้งานโดยผู้ดูแลระบบ");
        setIsBlocked(true);
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError("");
    const provider = new FacebookAuthProvider();
    provider.addScope("public_profile");
    provider.addScope("email");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const idToken = await user.getIdToken(true);
      setToken(idToken, 24);

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

      const payload = {
        uid: user.uid,
        email: user.email,
        displayName: fbName,
        photoURL: fbPic,
        provider: "facebook",
      };

      const syncRes = await postUsersSync(payload);

      if (!syncRes.ok) {
        const errData = await syncRes.json().catch(() => ({}));
        if (syncRes.status === 403 || errData.message?.includes("ระงับ")) {
          setBlockMessage(errData.message || "บัญชีของคุณถูกระงับการใช้งาน");
          setIsBlocked(true);
          setBlockedUid(user.uid);
          setIsLoading(false);
          return;
        }
        throw new Error(errData.message || "เซิร์ฟเวอร์เกิดข้อผิดพลาด");
      }

      await syncUserToRTDB(user.uid);

      // 🌟 ดึง Role จาก API สำหรับ Facebook
      const resData = await syncRes.json();
      const actualRole = resData.data?.role || resData?.role || "user";

      const updatedUser = {
        ...payload,
        role: actualRole,
      };

      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err: any) {
      if (err.code === "auth/user-disabled") {
        setBlockMessage("บัญชีของคุณถูกระงับการใช้งานโดยผู้ดูแลระบบ");
        setIsBlocked(true);
      } else {
        console.error("Facebook Login Error:", err);
        setError("ไม่สามารถเข้าสู่ระบบผ่าน Facebook ได้");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      if (!liff.isLoggedIn()) {
        const cleanUrl = window.location.origin + window.location.pathname;
        liff.login({ redirectUri: cleanUrl });
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("LINE Login Error:", err);
      setIsLoading(false);
      setError("ไม่สามารถเข้าสู่ระบบผ่าน LINE ได้");
    }
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl text-center border border-red-100 dark:border-red-900/30">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            การเข้าถึงถูกระงับ
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {blockMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          เข้าสู่ระบบ
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingScreen message="กำลังเชื่อมต่อระบบ..." />
        ) : (
          <div className="flex flex-col gap-4">
            {/* 🌟 ปุ่ม LINE ให้โชว์เสมอเป็นหลัก */}
            <button
              onClick={handleLineLogin}
              className="w-full py-4 bg-[#06C755] hover:bg-[#05b34d] text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-lg"
            >
              เข้าสู่ระบบด้วย LINE
            </button>

            {/* 🌟 3. ซ่อนฟอร์ม Email และ Facebook ถ้าเป็นระบบจริง (โชว์เฉพาะตอนเทสบน Localhost) */}
            {isLocalhost && (
              <>
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
                  <span className="mx-4 text-gray-400 text-sm">ส่วนสำหรับทดสอบระบบ (Localhost)</span>
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="อีเมล"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button className="w-full py-3 bg-gray-800 dark:bg-gray-600 hover:bg-gray-900 dark:hover:bg-gray-500 text-white font-bold rounded-xl transition-all shadow-md">
                    เข้าสู่ระบบด้วยอีเมล
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-2"
                  >
                    เข้าสู่ระบบด้วย Facebook
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}