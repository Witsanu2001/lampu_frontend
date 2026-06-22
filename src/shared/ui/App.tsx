/* eslint-disable prefer-const */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/shared/ui/App.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../modules/const/firebase";
import {
  getRedirectResult,
  FacebookAuthProvider,
  updateProfile,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import liff from "@line/liff";
import "../../style/App.css";

import Header from "./Header";
import { menuConfig, type MenuItem } from "./menu";
import { postLineAuth, postUsersSync } from "../../modules/api/api_login";
import { AppRoutes } from "../../app/routes";
import BottomNav from "./BottomNav";
import { setToken } from "../infra/auth/token";

const LIFF_ID = "2010209102-zHsx4M0r";
const PROJECT_NAME = "thungyai";

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigate = useNavigate();

  const location = useLocation();
  const isPaymentPage =
    location.pathname === "/orders/payment" ||
    /^\/orders_user\/[^/]+$/.test(location.pathname) ||
    /^\/orders\/[^/]+$/.test(location.pathname) ||
    /^\/settingsData\/[^/]+$/.test(location.pathname) ||
    /^\/listData\/history\/detail\/[^/]+$/.test(location.pathname);

  const [isAppLoading, setIsAppLoading] = useState(true);

  // 🌟 State จัดการสถานะ
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockedUid, setBlockedUid] = useState<string>("");

  useEffect(() => {
    const db = getDatabase(auth.app);
    const settingsRef = dbRef(db, `live_settings/${PROJECT_NAME}`);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      setStoreSettings(snapshot.val());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const uid = user?.uid || blockedUid;
    if (!uid) return;

    const db = getDatabase(auth.app);
    const userRef = dbRef(db, `live_users/${uid}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const isUserBlocked =
        data.is_blocked === true || data.is_blocked === "true";

      if (isUserBlocked) {
        setIsBlocked(true);
        setBlockedUid(uid);
      } else {
        setIsBlocked(false);
        setBlockedUid("");
      }

      setUser((prevUser: any) => {
        if (prevUser && data.role && prevUser.role !== data.role) {
          const updatedUser = { ...prevUser, role: data.role };
          localStorage.setItem("userData", JSON.stringify(updatedUser));
          return updatedUser;
        }
        return prevUser;
      });
    });

    return () => unsubscribe();
  }, [user?.uid, blockedUid]); // 🌟 ต้องมี blockedUid ในวงเล็บนี้ด้วย

  useEffect(() => {
    const calculateStoreStatus = () => {
      if (!storeSettings) return;
      const data = storeSettings;

      if (data.isManualOverride) {
        setIsStoreOpen(data.storeStatus === "open");
      } else {
        const now = new Date();

        // เช็ควันหยุดนักขัตฤกษ์
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const isHoliday = data.specialHolidays?.some(
          (h: any) => h.date === todayStr,
        );
        if (isHoliday) {
          setIsStoreOpen(false);
          return;
        }

        // เช็ควันหยุดประจำสัปดาห์
        const daysMap = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const currentDay = daysMap[now.getDay()];
        if (data.closedDays && data.closedDays[currentDay]) {
          setIsStoreOpen(false);
          return;
        }

        // เช็คเวลาเปิด-ปิด
        const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const openT = data.openTime || "00:00";
        const closeT = data.closeTime || "23:59";

        if (currentTimeStr >= openT && currentTimeStr <= closeT) {
          setIsStoreOpen(true);
        } else {
          setIsStoreOpen(false);
        }
      }
    };

    calculateStoreStatus(); // คำนวณครั้งแรก
    const interval = setInterval(calculateStoreStatus, 60000); // รีรันทุก 1 นาที (60,000 ms)

    return () => clearInterval(interval);
  }, [storeSettings]);

  useEffect(() => {
    // ใช้เงื่อนไขให้กระชับ
    if (isBlocked && location.pathname !== "/login") {
      // ใช้ setTimeout เพื่อให้ React ทำงานในรอบถัดไป (หลีกเลี่ยง error cascading render)
      const timer = setTimeout(() => {
        localStorage.removeItem("userData");
        setUser(null);
        navigate("/login");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isBlocked, location.pathname, navigate]);

  // useEffect(() => {
  //   const initializeSystem = async () => {
  //     try {
  //       const fbUser = await new Promise<any>((resolve) => {
  //         const unsubscribe = onAuthStateChanged(auth, (u) => {
  //           unsubscribe();
  //           resolve(u);
  //         });
  //       });

  //       await liff.init({ liffId: LIFF_ID });
  //       if (fbUser) {
  //         const token = await fbUser.getIdToken(true);
  //         setToken(token, 24);

  //         const savedUserStr = localStorage.getItem("userData");
  //         if (savedUserStr) {
  //           setUser(JSON.parse(savedUserStr));
  //         }
  //         await new Promise((resolve) => setTimeout(resolve, 100));
  //         setIsAppLoading(false);
  //         return;
  //       }

  //       if (liff.isLoggedIn()) {
  //         await handleLineUserData();
  //       } else {
  //         setIsAppLoading(false);
  //       }
  //     } catch (err) {
  //       console.error("System Init Error:", err);
  //       setIsAppLoading(false);
  //     }
  //   };

  //   initializeSystem();
  // }, []);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // 🌟 1. เช็ค LocalStorage ก่อนเลยว่ามีของไหม (เร็วที่สุด)
        const savedUserStr = localStorage.getItem("userData");

        // 🌟 2. สร้าง Promise เช็ค Firebase State
        const fbUser = await new Promise<any>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (u) => {
            unsubscribe();
            resolve(u);
          });
        });

        // 🌟 3. ถ้าในเครื่องมีข้อมูล และ Firebase จำได้ -> ให้เข้าแอปเลย โดยไม่ต้องไป Init LIFF
        // (ลดเวลาได้ 1-3 วินาทีเต็มๆ)
        if (fbUser && savedUserStr) {
          setUser(JSON.parse(savedUserStr));
          setIsAppLoading(false); // ปิด Loading Screen ให้แสดงหน้าหลักทันที

          // แอบไปรีเฟรช Token เบื้องหลังเงียบๆ
          fbUser.getIdToken(true).then((token: string) => setToken(token, 24));
          return; // 🛑 จบการทำงานฟังก์ชัน ไม่ต้องลงไปทำ LIFF Init
        }

        // 🌟 4. แต่ถ้าผู้ใช้เพิ่งเข้ามาครั้งแรก หรือไม่มีข้อมูลล็อกอิน ค่อยสั่ง Init LIFF
        await liff.init({ liffId: LIFF_ID });

        if (liff.isLoggedIn()) {
          // ถ้า LIFF จำได้ว่าล็อกอินไลน์ไว้แล้ว ให้ไปดึงข้อมูลมาล็อคอินใหม่
          await handleLineUserData();
        } else {
          // ถ้าไม่เคยล็อคอินอะไรเลย ปล่อยไปหน้า Login ตามปกติ
          setIsAppLoading(false);
        }
      } catch (err) {
        console.error("System Init Error:", err);
        setIsAppLoading(false);
      }
    };

    initializeSystem();
  }, []);

  const handleLineUserData = async () => {
    try {
      const lineIdToken = liff.getIDToken();
      if (!lineIdToken)
        throw new Error(
          "ไม่พบ ID Token (ลืมเปิด openid ในระบบ LINE Developers หรือเปล่า?)",
        );

      const res = await postLineAuth(lineIdToken);
      if (!res.ok) throw new Error(`Backend ตอบกลับ Status: ${res.status}`);
      const data = await res.json();

      if (!data.firebase_token)
        throw new Error("Backend ไม่ยอมส่ง Firebase Token กลับมาให้");

      const userCredential = await signInWithCustomToken(
        auth,
        data.firebase_token,
      );
      const profile = await liff.getProfile();
      if (!profile) throw new Error("ดึง Profile จาก LINE ไม่สำเร็จ");

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
      setIsAppLoading(false);
    } catch (err: any) {
      alert(`🚨 ระบบขัดข้อง:\n${err.message}`);
      console.error("LINE Auth Error:", err);
      if (!liff.isInClient()) liff.logout();
      localStorage.removeItem("userData");
      setUser(null);
      setIsAppLoading(false);
    }
  };

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
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {user && !isPaymentPage && <Header user={user} setUser={setUser} />}

      <div className="flex flex-1 overflow-hidden relative">
        {user && !isPaymentPage && (
          <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 p-6 overflow-hidden z-10">
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

      {/* 🌟 Modal 1: แจ้งเตือนเมื่อบัญชีโดนบล็อก (ความสำคัญสูงสุด) */}
      {isBlocked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-red-600 dark:text-red-400 mb-2">
              บัญชีถูกระงับการใช้งาน
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              ขออภัยค่ะ บัญชีของคุณถูกระงับการใช้งานชั่วคราว
              ไม่สามารถทำรายการได้ในขณะนี้
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      )}

      {!isBlocked && !isStoreOpen && (!user || user.role === "user") && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center transform transition-all">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">
              ร้านปิดให้บริการ
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-2">
              ขออภัยค่ะ ขณะนี้อยู่นอกเวลาทำการ
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
              กรุณากลับมาใหม่ภายหลังนะคะ 🙏
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
