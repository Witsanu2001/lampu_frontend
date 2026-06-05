/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/shared/ui/App.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { auth } from "../../modules/const/firebase"; 
import { getRedirectResult, FacebookAuthProvider, updateProfile, signInWithCustomToken } from "firebase/auth";
import liff from "@line/liff";
import AppRoutes from "../../app/routes";
import '../../style/App.css';

import Header from "./Header";
import { menuConfig, type MenuItem } from "./menu";

const LIFF_ID = "2010209102-zHsx4M0r";

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 1. ตรวจสอบการโหลดและการเข้าสู่ระบบของ LINE LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          handleLineUserData();
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
        const res = await fetch("https://api-gateway-879165280409.asia-southeast1.run.app/api/auth/line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: lineIdToken })
        });
        
        if (!res.ok) throw new Error("แลกโทเค็นไม่สำเร็จ");
        const data = await res.json();
        
        const userCredential = await signInWithCustomToken(auth, data.firebase_token);
        
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
        await fetch("https://api-gateway-879165280409.asia-southeast1.run.app/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firebaseToken}` 
          },
          body: JSON.stringify(lineUser)
        });
        
        console.log("✅ ล็อกอิน LINE + บันทึก Firestore สำเร็จ!");
      }
    } catch (err) {
      console.error("LINE Auth Error:", err);
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
            const response = await fetch(`https://graph.facebook.com/me?fields=picture.width(500).height(500)&access_token=${token}`);
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
        if (err.code !== "auth/redirect-cancelled-by-user") console.error(err.message);
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
    /* 🌟 Root Container: บังคับเต็มจอ 100vh, ไม่ให้เลื่อน (overflow-hidden) และจัดเรียงแบบคอลัมน์ */
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      
      {/* Header */}
      {user && <Header user={user} setUser={setUser} />}
      
      {/* Navbar: ใส่ shrink-0 เพื่อไม่ให้เมนูโดนบีบเมื่อพื้นที่เนื้อหาด้านล่างเปลี่ยนขนาด */}
      {user && (
        <nav className="shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4 shadow-sm z-10">
          
          {/* ส่วนเมนูหลัก */}
          <div className="flex flex-wrap items-center gap-6">
            {menuConfig.filter(hasPermission).map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className="font-bold text-gray-800 dark:text-gray-100 text-[15px] hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* ส่วนเมนูย่อย (Submenu) */}
          <div className="flex flex-wrap gap-3 mt-1">
            {menuConfig
              .filter(hasPermission)
              .filter((item) => item.submenu && item.submenu.length > 0)
              .map((item) =>
                item.submenu?.filter(hasPermission).map((subItem, subIndex) => (
                  <Link
                    key={`${item.to}-${subIndex}`}
                    to={subItem.to}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-1.5 rounded-lg transition-colors duration-200"
                  >
                    {subItem.label}
                  </Link>
                ))
              )}
          </div>
        </nav>
      )}
      
      {/* 🌟 Main Content: ใช้ flex-1 เพื่อให้กินพื้นที่เต็มส่วนที่เหลือ และตั้ง overflow-hidden เพื่อห้าม Scroll */}
      <main className="flex-1 overflow-hidden relative">
        <AppRoutes user={user} setUser={setUser} />
      </main>
      
    </div>
  );
}