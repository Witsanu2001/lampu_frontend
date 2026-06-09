/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/shared/ui/App.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../../modules/const/firebase";
import {
  getRedirectResult,
  FacebookAuthProvider,
  updateProfile,
  signInWithCustomToken,
} from "firebase/auth";
import liff from "@line/liff";
import AppRoutes from "../../app/routes";
import "../../style/App.css";

import Header from "./Header";
import { menuConfig, type MenuItem } from "./menu";

const LIFF_ID = "2010209102-zHsx4M0r";

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const location = useLocation();
  const isPaymentPage = location.pathname === "/payment"; // หรือ "/payment" ตามที่คุณใช้จริง

  // 1. ตรวจสอบการโหลดและการเข้าสู่ระบบของ LINE LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          const savedUser = localStorage.getItem("userData");
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.provider === "line") {
                setUser(parsedUser);
                console.log("✅ ใช้ข้อมูลผู้ใช้เดิมจาก localStorage (LIFF session ยังอยู่)");
                return;
              }
            } catch (parseErr) {
              console.error("Parse userData error:", parseErr);
            }
          }
          // ถ้าไม่มี userData ให้ดึงข้อมูลจาก API ใหม่
          handleLineUserData();
        } else {
          // 🎯 [จุดที่แก้ไข] ถ้าระบบไม่ได้ login LIFF แต่ดันมีข้อมูลค้างอยู่ ให้เคลียร์ทิ้ง
          // ❌ ห้ามเรียก liff.login() อัตโนมัติเด็ดขาด ป้องกันบั๊ก 400 Bad Request
          const savedUser = localStorage.getItem("userData");
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.provider === "line") {
                localStorage.removeItem("userData");
                setUser(null);
              }
            } catch (e) {
              console.error("Error clearing stale user data", e);
            }
          }
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
      }
    };
    initLiff();
  }, []);

  const handleLineUserData = async () => {
    try {
      const lineIdToken = liff.getIDToken();

      if (lineIdToken) {
        const res = await fetch(
          "https://api-gateway-879165280409.asia-southeast1.run.app/api/auth/line",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: lineIdToken }),
          },
        );

        if (!res.ok) throw new Error("แลกโทเค็นไม่สำเร็จ");
        const data = await res.json();

        const userCredential = await signInWithCustomToken(
          auth,
          data.firebase_token,
        );

        const profile = await liff.getProfile();
        const decodedToken = liff.getDecodedIDToken() as any;
        const lineUser = {
          uid: profile.userId,
          email: decodedToken?.email || "",
          displayName: profile.displayName,
          photoURL: profile.pictureUrl,
          provider: "line",
        };

        setUser(lineUser);
        localStorage.setItem("userData", JSON.stringify(lineUser));

        const firebaseToken = await userCredential.user.getIdToken(true);
        await fetch(
          "https://api-gateway-879165280409.asia-southeast1.run.app/api/users/sync",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firebaseToken}`,
            },
            body: JSON.stringify(lineUser),
          },
        );

        console.log("✅ ล็อกอิน LINE + บันทึก Firestore สำเร็จ!");
      }
    } catch (err) {
      console.error("LINE Auth Error:", err);
      // 🎯 เมื่อ LINE token หมดอายุหรือ invalid ต้อง logout และให้ user login ใหม่
      // เพราะไม่สามารถ restore user state จาก localStorage ได้ (Firebase auth ยังไม่ได้ sign in)
      liff.logout();
      localStorage.removeItem("userData");
      setUser(null);
    }
  };

  // 2. ติดตามสถานะ Firebase (Email / Facebook)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const userDataToSave = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          provider: "firebase",
        };
        setUser(userDataToSave);
        localStorage.setItem("userData", JSON.stringify(userDataToSave));
      } else {
        setUser((prevUser: any) => {
          if (prevUser?.provider === "line") return prevUser;
          localStorage.removeItem("userData");
          return null;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. จัดการผลลัพธ์จากการล็อกอิน Facebook
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
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
              const updatedUser = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: realPicUrl,
                provider: "firebase",
              };
              setUser(updatedUser);
              localStorage.setItem("userData", JSON.stringify(updatedUser));
            }
          }
        }
      } catch (err: any) {
        if (err.code !== "auth/redirect-cancelled-by-user")
          console.error(err.message);
      }
    };
    handleRedirectResult();
  }, []);

  // ฟังก์ชันจัดการเช็คสิทธิ์ผู้ใช้งานประจำเมนูย่อย/เมนูหลัก
  const hasPermission = (item: MenuItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user?.role);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* 1. Header */}
      {user && !isPaymentPage && <Header user={user} setUser={setUser} />}

      {/* 2. Mobile Menu Bar (แสดงเฉพาะมือถือและแท็บเล็ต - เอาไว้ใต้ Header) */}
      {user && !isPaymentPage && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center p-2">
          {menuConfig.filter(hasPermission).map((item, index) => {
            const icon = item.label.split(" ")[0];
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={index}
                to={item.to}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isActive
                    ? "bg-emerald-200 dark:bg-emerald-700/50 text-emerald-800 dark:text-emerald-300"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/30"
                }`}
              >
                <span className="text-2xl">{icon}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Desktop Sidebar (แสดงเฉพาะหน้าจอคอมพิวเตอร์ขนาดใหญ่) */}
        {user && !isPaymentPage && (
          <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 gap-8 overflow-y-auto">
            <div className="flex flex-col gap-6">
              {menuConfig.filter(hasPermission).map((item, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Link
                    to={item.to}
                    className="font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.submenu?.filter(hasPermission).map((sub, sIndex) => (
                    <Link
                      key={sIndex}
                      to={sub.to}
                      className="ml-4 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* 3. Main Content */}
        <main
          className={`flex-1 overflow-y-auto relative ${!isPaymentPage ? "pb-20 xl:pb-0" : ""}`}
        >
          <AppRoutes user={user} setUser={setUser} />
        </main>
      </div>
    </div>
  );
}
