/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/shared/ui/App.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // 🌟 เพิ่มตัวนี้เพื่อใช้ทำลิงก์เปลี่ยนหน้า
import { auth } from "../../modules/const/firebase"; 
import { getRedirectResult, FacebookAuthProvider, updateProfile } from "firebase/auth";
import liff from "@line/liff";
import AppRoutes from "../../app/routes";

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
    } catch (err) {
      console.error("LINE Get Profile Error:", err);
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

  // 🌟 ฟังก์ชันจัดการเช็คสิทธิ์ผู้ใช้งานประจำเมนูย่อย/เมนูหลัก
  const hasPermission = (item: MenuItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user?.role);
  };

  return (
    <>
      {/* แสดง Header เฉพาะตอนที่ล็อกอินแล้ว */}
      {user && <Header user={user} setUser={setUser} />}
      
      {/* 🌟 วาดเมนูตรงนี้ทันทีจาก menuConfig โดยไม่ต้องเรียกผ่านไฟล์ Menu.tsx */}
      {user && (
        <nav
          style={{
            padding: "16px 24px",
            background: "var(--code-bg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* ส่วนเมนูหลัก */}
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {menuConfig.filter(hasPermission).map((item, index) => (
              <Link
                key={index}
                to={item.to}
                style={{
                  fontWeight: "bold",
                  textDecoration: "none",
                  color: "var(--text-h)",
                  fontSize: "15px",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* ส่วนเมนูย่อย (Submenu) */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {menuConfig
              .filter(hasPermission)
              .filter((item) => item.submenu && item.submenu.length > 0)
              .map((item) =>
                item.submenu?.filter(hasPermission).map((subItem, subIndex) => (
                  <Link
                    key={`${item.to}-${subIndex}`}
                    to={subItem.to}
                    style={{
                      textDecoration: "none",
                      color: "var(--text)",
                      fontSize: "14px",
                      background: "rgba(0,0,0,0.05)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    {subItem.label}
                  </Link>
                ))
              )}
          </div>
        </nav>
      )}
      
      {/* ระบบเปลี่ยนหน้าหลัก */}
      <AppRoutes user={user} setUser={setUser} />
    </>
  );
}