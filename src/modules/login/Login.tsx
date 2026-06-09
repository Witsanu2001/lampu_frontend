/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { auth, facebookProvider } from "../const/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  FacebookAuthProvider,
  updateProfile,
} from "firebase/auth";
import liff from "@line/liff";

interface LoginProps {
  setUser: (user: any) => void;
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
      let userCredential;
      if (isLoginView) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
      }

      // 🌟 1. ดึงข้อมูลและ Token ของผู้ใช้ที่เพิ่งล็อกอิน/สมัครสำเร็จ
      const user = userCredential.user;
      const idToken = await user.getIdToken(true);

      // สร้าง Object ผู้ใช้เบื้องต้น
      let updatedUser: any = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || email.split("@")[0],
        photoURL: user.photoURL || "",
        provider: "email",
        role: "user", // ใส่ค่าเริ่มต้นไว้ก่อน
      };

      // 🌟 2. ยิงข้อมูลไปหา API Gateway เพื่อบันทึกและดึง role จาก Firestore
      try {
        const syncResponse = await fetch(
          "https://api-gateway-879165280409.asia-southeast1.run.app/api/users/sync",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(updatedUser),
          },
        );

        if (syncResponse.ok) {
          const resData = await syncResponse.json();
          const syncedUser = resData.data;
          
          // 🎯 นำค่า role จากเซิร์ฟเวอร์มาอัปเดต (ถ้าเป็น user เก่าอาจจะได้สิทธิ์ admin กลับมา)
          updatedUser = {
            ...updatedUser,
            role: syncedUser?.role || "user",
          };
          console.log("✅ บันทึกผู้ใช้อีเมลลงฐานข้อมูลสำเร็จ! สิทธิ์ปัจจุบัน:", updatedUser.role);
        }
      } catch (apiErr) {
        console.error("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Backend:", apiErr);
      }

      // 🌟 3. เซฟลง State ของ React และ LocalStorage (หลังอัปเดต Role แล้ว)
      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));

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
        const response = await fetch(
          `https://graph.facebook.com/me?fields=picture.width(500).height(500)&access_token=${token}`,
        );
        const data = await response.json();

        if (data?.picture?.data) {
          const realPicUrl = data.picture.data.url;
          await updateProfile(result.user, { photoURL: realPicUrl });

          // จัดรูปแบบข้อมูลเบื้องต้น
          let updatedUser: any = {
            uid: result.user.uid,
            email: result.user.email || "",
            displayName: result.user.displayName || "ผู้ใช้ใหม่",
            photoURL: realPicUrl || "",
            provider: "facebook",
            role: "user", // ใส่ค่าเริ่มต้นไว้ก่อน
          };

          // 🌟 3. ยิงข้อมูลไปหา API Gateway เพื่อบันทึกและดึง role
          try {
            const idToken = await result.user.getIdToken(true);

            const syncResponse = await fetch(
              "https://api-gateway-879165280409.asia-southeast1.run.app/api/users/sync",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(updatedUser),
              },
            );

            if (syncResponse.ok) {
              const resData = await syncResponse.json();
              const syncedUser = resData.data;

              // 🎯 นำค่า role จากเซิร์ฟเวอร์มาอัปเดต
              updatedUser = {
                ...updatedUser,
                role: syncedUser?.role || "user",
              };
              console.log("✅ ยิง API สำเร็จ! สิทธิ์ผู้ใช้คือ:", updatedUser.role);
            } else {
              console.error("❌ ยิง API ไม่สำเร็จ สถานะ:", syncResponse.status);
            }
          } catch (apiErr) {
            console.error("❌ เกิดข้อผิดพลาดในการเรียก API Gateway:", apiErr);
          }

          // 🌟 4. บันทึกลง State ของ React และ LocalStorage (หลังอัปเดต Role แล้ว)
          setUser(updatedUser);
          localStorage.setItem("userData", JSON.stringify(updatedUser));
        }
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message);
      }
    }
  };

  const handleLineLogin = () => {
    if (!liff.isLoggedIn()) {
      // 🎯 ลบ redirectUri ออก ปล่อยให้ liff.login() ทำงานแบบ Default (ปลอดภัยที่สุด)
      liff.login();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        {/* หัวข้อ */}
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          {isLoginView ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </h2>

        {/* ฟอร์มล็อกอิน / สมัครสมาชิก */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />

          {error && (
            <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoginView ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </form>

        {/* เส้นแบ่ง "หรือ" */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          <span className="mx-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
            หรือ
          </span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
        </div>

        {/* ปุ่ม Social Login */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLineLogin}
            type="button"
            className="w-full py-3 bg-[#00B900] hover:bg-[#009900] text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2"
          >
            ดำเนินการต่อด้วย LINE
          </button>

          <button
            onClick={handleFacebookLogin}
            type="button"
            className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2"
          >
            ดำเนินการต่อด้วย Facebook
          </button>
        </div>

        {/* สลับหน้าล็อกอิน/สมัครสมาชิก */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError("");
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline transition-colors duration-200"
          >
            {isLoginView
              ? "ยังไม่มีบัญชีใช่ไหม? สมัครเลย"
              : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
}