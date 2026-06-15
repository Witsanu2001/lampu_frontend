/* eslint-disable prefer-const */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/shared/ui/App.tsx
import { useState, useEffect, useRef } from "react";
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
import { setToken, removeToken } from "../infra/auth/token";
import BottomNav from "./BottomNav";

const LIFF_ID = "2010209102-zHsx4M0r";

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const location = useLocation();
  const isPaymentPage = location.pathname === "/orders/payment";
  const [isAppLoading, setIsAppLoading] = useState(true);
  const isInitialized = useRef(false);

  // 1. ตรวจสอบการโหลดและการเข้าสู่ระบบของ LINE LIFF
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

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
                setIsAppLoading(false);
                return;
              }
            } catch (e) {
              console.error(e);
            }
          }
          await handleLineUserData();
          setIsAppLoading(false);
        } else {
          if (liff.isInClient()) {
            liff.login();
          } else {
            setIsAppLoading(false);
          }
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
        setIsAppLoading(false);
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
          role: "user",
        };

        const firebaseToken = await userCredential.user.getIdToken(true);
        setToken(firebaseToken, 24);

        const syncRes = await postUsersSync(lineUser);
        if (syncRes.ok) {
          const resData = await syncRes.json();
          lineUser.role = resData.data?.role || "user";
        }

        setUser(lineUser);
        localStorage.setItem("userData", JSON.stringify(lineUser));
      }
    } catch (err) {
      console.error("LINE Auth Error:", err);
      if (!liff.isInClient()) liff.logout();
      localStorage.removeItem("userData");
      setUser(null);
    }
  };

  // 2. ติดตามสถานะ Firebase (Email / Facebook)
  const [, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setIsAuthLoading(true);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true);
          setToken(idToken, 24);
          const syncRes = await postUsersSync({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            provider: "firebase",
          });

          if (syncRes.ok) {
            const resData = await syncRes.json();
            const syncedUser = resData.data;
            const finalUserData = { ...syncedUser, provider: "firebase" };
            setUser(finalUserData);
            localStorage.setItem("userData", JSON.stringify(finalUserData));
          }
        } catch (e) {
          console.error("Sync Error:", e);
        }
      } else {
        setUser(null);
        localStorage.removeItem("userData");
        removeToken();
      }
      setIsAuthLoading(false);
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
              `https://graph.facebook.com/me?fields=id,name,email,picture.width(500).height(500)&access_token=${token}`,
            );
            const data = await response.json();
            if (data?.picture?.data) {
              const realPicUrl = data.picture.data.url;
              await updateProfile(result.user, { photoURL: realPicUrl });
              const updatedUser = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: data.name,
                photoURL: data.picture?.data?.url || result.user.photoURL,
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

  const hasPermission = (item: MenuItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user?.role);
  };

  if (isAppLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>กำลังเชื่อมต่อระบบ...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {user && !isPaymentPage && <Header user={user} setUser={setUser} />}

      <div className="flex flex-1 overflow-hidden">
        {user && !isPaymentPage && (
          <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 p-6 overflow-hidden">
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

        <main
          className={`flex-1 overflow-y-auto ${isPaymentPage ? "pb-0" : "pb-[80px]"} md:pb-0 scroll-smooth`}
        >
          <AppRoutes user={user} setUser={setUser} />
        </main>

        <BottomNav
          user={user}
          isPaymentPage={isPaymentPage}
          hasPermission={hasPermission}
        />
      </div>
    </div>
  );
}
