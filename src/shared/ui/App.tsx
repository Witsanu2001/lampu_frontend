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
import "../../style/App.css";

import Header from "./Header";
import { menuConfig, type MenuItem } from "./menu";
import { postLineAuth, postUsersSync } from "../../modules/api/api_login";
import { AppRoutes } from "../../app/routes";

const LIFF_ID = "2010209102-zHsx4M0r";

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const location = useLocation();
  const isPaymentPage = location.pathname === "/orders/payment";

  // 1. ตรวจสอบการโหลดและการเข้าสู่ระบบของ LINE LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          // 🎯 เช็กว่ามี userData ใน localStorage อยู่แล้วหรือไม่
          const savedUser = localStorage.getItem("userData");
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.provider === "line") {
                setUser(parsedUser);
                console.log(
                  "✅ ใช้ข้อมูลผู้ใช้เดิมจาก localStorage (LIFF session ยังอยู่)",
                );
                return;
              }
            } catch (parseErr) {
              console.error("Parse userData error:", parseErr);
            }
          }
          // ถ้าไม่มี userData หรือไม่ใช่ LINE provider ให้ลอง authenticate ใหม่
          handleLineUserData();
        } else {
          // 🎯 ถ้า LIFF ยังไม่ login แต่อยู่ใน LINE environment ให้ login อัตโนมัติ
          // เพื่อป้องกันการ redirect ไปหน้า login แล้วไป LINE login page ซ้ำ
          if (liff.isInClient()) {
            console.log(
              "🎯 อยู่ใน LINE environment แต่ยังไม่ login → login อัตโนมัติ",
            );
            liff.login();
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
        const res = await postLineAuth(lineIdToken);

        if (!res.ok) throw new Error("แลกโทเค็นไม่สำเร็จ");
        const data = await res.json();

        const userCredential = await signInWithCustomToken(
          auth,
          data.firebase_token,
        );

        const profile = await liff.getProfile();
        const decodedToken = liff.getDecodedIDToken() as any;
        
        let lineUser: any = {
          uid: profile.userId,
          email: decodedToken?.email || "",
          displayName: profile.displayName,
          photoURL: profile.pictureUrl,
          provider: "line",
          role: "user" 
        };

        const firebaseToken = await userCredential.user.getIdToken(true);
        
        // เรียกใช้งานฟังก์ชันแยกตัวเดิม
        const syncRes = await postUsersSync(firebaseToken, lineUser);

        if (syncRes.ok) {
          const resData = await syncRes.json();
          const syncedUser = resData.data;

          lineUser = {
            ...lineUser,
            role: syncedUser?.role || "user", 
          };
          console.log("✅ ล็อกอิน LINE + บันทึกสิทธิ์สำเร็จ! Role:", lineUser.role);
        }

        setUser(lineUser);
        localStorage.setItem("userData", JSON.stringify(lineUser));
      }
    } catch (err) {
      console.error("LINE Auth Error:", err);
      if (!liff.isInClient()) {
         liff.logout();
      }
      localStorage.removeItem("userData");
      setUser(null);
    }
  };

  // 2. ติดตามสถานะ Firebase (Email / Facebook)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        // 🎯 ดึงข้อมูลเดิมในคลังมาตรวจสอบก่อนเพื่อรักษาค่า role ปัจจุบันไว้
        const savedUserStr = localStorage.getItem("userData");
        let existingRole = "user";

        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.uid === currentUser.uid) {
              existingRole = parsed.role || "user";
            }
          } catch (e) {
            console.error(e);
          }
        }

        const userDataToSave = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          provider: "firebase",
          role: existingRole, // 🎯 นำค่าสิทธิ์เดิมกลับมาใส่ ห้ามปล่อยเป็นค่าว่าง
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

      {/* 2. Mobile Menu Bar (แสดงเฉพาะมือถือและแท็บเล็ต) */}
      {user && !isPaymentPage && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center p-2">
          {menuConfig.filter(hasPermission).map((item, index) => {
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
                {/* 🎯 แสดงผลเฉพาะไอคอน! (ถ้าระบุรูป png จะเอารูปมาโชว์ ถ้าไม่มีรูปจะเอา Emoji มาโชว์) */}
                <img
                  src={item.iconUrl}
                  alt="" /* ปล่อยว่างเพื่อไม่ให้มีตัวหนังสือโผล่มากวนใจตอนรูปไม่ขึ้น */
                  className="w-7 h-7 object-contain drop-shadow-sm"
                />
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
