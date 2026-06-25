/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useCart } from "../../shared/context/CartContext";
import { useLocation, useNavigate } from "react-router-dom";
import { addOrders, getAddOnMenus } from "../api/api_order";
import { getFreshToken } from "../../shared/infra/auth/token";

// 🌟 นำเข้าคอมโพเนนต์แผนที่
import SelectMaps from "../address/SelectMaps";
import { getLocationsDefault } from "../api/api_location";
import {
  DEFAULT_CHACOAL,
  DEFAULT_DELIVERY_FEE,
  DEFAULT_MEET_UP_FEE,
  DEFAULT_PAN,
  DEFAULT_STOVE,
} from "../../shared/const/config";
import { Loading } from "../../shared/components/Loading";

export default function Payment() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } =
    useCart();

  const [addOnMenus, setAddOnMenus] = useState<any[]>([]);
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(true);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);

  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 🌟 State สำหรับคุมหน้าจอโหลดตอนเปิดเข้ามาครั้งแรก
  const [isPageLoading, setIsPageLoading] = useState(true);

  // 🌟 State สำหรับแอดมินกรอกข้อมูล
  const [adminRecipient, setAdminRecipient] = useState("");
  const [adminPhone, setAdminPhone] = useState(""); // บังคับกรอกเบอร์
  const [adminAddressDetail, setAdminAddressDetail] = useState("");

  // 🌟 State สำหรับรับค่าจาก SelectMaps โดยเฉพาะ
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);
  const [applyDeliveryFee, setApplyDeliveryFee] = useState<boolean>(true);

  const [distance, setDistance] = useState<number>(0);
  const [isMeetup, setIsMeetup] = useState<boolean>(false);

  const mainItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [needEquipment, setNeedEquipment] = useState(false);
  const [stoveCount, setStoveCount] = useState(0);
  const [panCount, setPanCount] = useState(0);
  const [charcoalCount, setCharcoalCount] = useState(0);

  // ✨ State สำหรับระบบ Loading และ Popup
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: "confirm" | "success" | "error" | "warning";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showPopup = (
    type: "confirm" | "success" | "error" | "warning",
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
  ) => {
    setPopup({ isOpen: true, type, title, message, onConfirm, onCancel });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  // 🌟 รวบรวมการโหลดข้อมูล (User, Address, AddOn) ไว้ใน useEffect เดียว
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      setIsPageLoading(true);

      try {
        const userDataString = localStorage.getItem("userData");
        const user = userDataString ? JSON.parse(userDataString) : null;
        if (isMounted && user) {
          setCurrentUser(user);
        }

        let token = "";
        try {
          token = await getFreshToken();
        } catch (e) {
          console.warn("Could not get token", e);
        }

        const [addons, defaultLocation] = await Promise.all([
          token ? getAddOnMenus(token).catch(() => []) : Promise.resolve([]),
          (async () => {
            const state = routerLocation.state as any;
            if (state?.selectedAddress) return state.selectedAddress;

            const savedAddressesStr = localStorage.getItem("userAddresses");
            if (
              savedAddressesStr &&
              savedAddressesStr !== "null" &&
              savedAddressesStr !== "[]"
            ) {
              const parsed = JSON.parse(savedAddressesStr);
              return Array.isArray(parsed) && parsed.length > 0
                ? parsed[0]
                : parsed;
            }

            const userId = user?.id || user?.uid;
            if (userId) {
              try {
                return await getLocationsDefault(userId);
              } catch (err) {
                return null;
              }
            }
            return null;
          })(),
        ]);

        if (isMounted) {
          setAddOnMenus(addons.filter((item: any) => item.available));
          setIsLoadingAddOns(false);

          if (defaultLocation) {
            setShippingAddress(defaultLocation);
          }
        }
      } catch (error) {
        console.error("Error initializing payment page:", error);
      } finally {
        if (isMounted) {
          setIsPageLoading(false); // ปิดหน้าจอโหลดเมื่อเสร็จสิ้น
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [routerLocation.state]);

  const isAdmin = currentUser?.role === "admin";
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (isAdmin) {
      setPaymentMethod("เก็บเงินปลายทาง");
    }
  }, [isAdmin]);

  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (mainItemsCount > 0 && !isInitialized) {
      if (needEquipment) {
        setStoveCount(mainItemsCount);
        setPanCount(mainItemsCount);
      }
      setIsInitialized(true);
    }
  }, [mainItemsCount, isInitialized, needEquipment]);

  const handleIncreaseMainItem = (id: string, currentQty: number) => {
    updateQuantity(id, currentQty + 1);
    setStoveCount((prev) => (prev > mainItemsCount ? prev : prev + 1));
    setPanCount((prev) => (prev > mainItemsCount ? prev : prev + 1));
  };

  const handleDecreaseMainItem = (id: string, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity(id, currentQty - 1);
    } else {
      removeFromCart(id);
    }
    setStoveCount((prev) => Math.max(0, prev - 1));
    setPanCount((prev) => Math.max(0, prev - 1));
  };

  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [homeImageFile, setHomeImageFile] = useState<File | null>(null);

  const MOCK_QR_URL =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTlus3TuguVCRXdx3HsPTVWhPtmx5_n9nBV02SsUgNHA&s=10";

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(MOCK_QR_URL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Lampu-MooKrata-QR.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showPopup(
        "warning",
        "ดาวน์โหลดไม่สำเร็จ",
        "กรุณาลองกดค้างที่รูป QR Code แล้วเลือก 'บันทึกรูปภาพ' แทนนะครับ",
      );
    }
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipPreview(URL.createObjectURL(file));
      setSlipFile(file);
    }
  };

  const compressImage = (
    file: File,
    maxWidth: number = 1024,
    quality: number = 0.7,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  }),
                );
              } else {
                reject(new Error("Canvas is empty"));
              }
            },
            "image/jpeg",
            quality,
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleHomeImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1 * 1024 * 1024) {
        setHomeImageFile(await compressImage(file));
      } else {
        setHomeImageFile(file);
      }
    } catch (error) {
      showPopup("error", "ข้อผิดพลาด", "ไม่สามารถประมวลผลรูปภาพได้");
    }
  };

  const handleAddAddOn = (addon: any) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((item) => item.id === addon.id);
      if (existing) {
        return prev.map((item) =>
          item.id === addon.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...addon, quantity: 1 }];
    });
  };

  const handleUpdateAddOnQuantity = (id: string, amount: number) => {
    setSelectedAddOns((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + amount } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const deliveryFeePerSet = isAdmin
    ? applyDeliveryFee
      ? isMeetup
        ? DEFAULT_MEET_UP_FEE
        : deliveryFee > 0
          ? deliveryFee
          : DEFAULT_DELIVERY_FEE // 🌟 ถ้าค่าส่งเป็น 0 ให้ใช้ค่าเริ่มต้นแทน
      : 0 // ถ้าไม่ติ๊กคิดเงิน ให้เป็น 0
    : isMeetup
      ? DEFAULT_MEET_UP_FEE
      : shippingAddress?.deliveryFee || shippingAddress?.fee || 0;

  const shippingFee = mainItemsCount * deliveryFeePerSet;

  const addOnTotal = selectedAddOns.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const extraStoves = needEquipment
    ? Math.max(0, stoveCount - mainItemsCount)
    : 0;
  const extraPans = needEquipment ? Math.max(0, panCount - mainItemsCount) : 0;
  const stoveFee = extraStoves * DEFAULT_STOVE;
  const panFee = extraPans * DEFAULT_PAN;
  const charcoalFee = needEquipment ? charcoalCount * DEFAULT_CHACOAL : 0;

  const grandTotal =
    cartTotal + shippingFee + addOnTotal + charcoalFee + stoveFee + panFee;

  // ✨ ฟังก์ชันสำหรับตรวจสอบและเปิดหน้าต่างคอนเฟิร์ม
  const handleConfirmPayment = () => {
    if (!isAdmin && !shippingAddress) {
      showPopup(
        "warning",
        "ข้อมูลไม่ครบถ้วน",
        "กรุณาเพิ่มที่อยู่จัดส่งก่อนยืนยันคำสั่งซื้อครับ/ค่ะ 📍",
      );
      return;
    }

    const userId = currentUser?.id || currentUser?.uid || "";
    if (!userId) {
      showPopup(
        "error",
        "ข้อผิดพลาด",
        "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้งครับ",
      );
      return;
    }

    if (isAdmin) {
      if (!adminPhone.trim()) {
        showPopup(
          "warning",
          "ข้อมูลไม่ครบถ้วน",
          "กรุณากรอกเบอร์โทรศัพท์ของลูกค้าด้วยครับ",
        );
        return;
      }
      if (adminAddressDetail.trim() === "") {
        // ให้คอนเฟิร์มว่าไปต่อโดยไม่มีรายละเอียดที่อยู่
        showPopup(
          "confirm",
          "ไม่มีรายละเอียดที่อยู่",
          "ยังไม่ได้กรอกรายละเอียดที่อยู่ แน่ใจหรือไม่ที่จะไปต่อและยืนยันคำสั่งซื้อ?",
          () => {
            closePopup();
            executePayment(userId); // ดำเนินการต่อ
          },
        );
        return;
      }
    }

    if (paymentMethod === "promptpay" && !slipFile && !isAdmin) {
      showPopup(
        "warning",
        "ข้อมูลไม่ครบถ้วน",
        "กรุณาอัปโหลดสลิปหลักฐานการโอนเงินก่อนยืนยันคำสั่งซื้อครับ/ค่ะ",
      );
      return;
    }

    // เปิด Popup ถามความมั่นใจก่อนส่ง
    showPopup(
      "confirm",
      "ยืนยันการสั่งซื้อ?",
      `ยอดชำระทั้งหมด: ฿${grandTotal.toLocaleString()}\nคุณต้องการยืนยันคำสั่งซื้อใช่หรือไม่?`,
      () => {
        closePopup();
        executePayment(userId); // กดยืนยันแล้ว ส่งข้อมูลจริง
      },
    );
  };

  // ✨ ฟังก์ชันส่งข้อมูลจริงไปที่ API (ถูกเรียกใช้เมื่อกดยืนยันใน Popup)
  const executePayment = async (userId: string) => {
    setIsSubmitting(true);

    const orderData = {
      mainItems: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      addOnItems: selectedAddOns.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      equipment: {
        needEquipment,
        stoveCount,
        panCount,
        charcoalCount,
        extraStoves,
        extraPans,
        stoveFee,
        panFee,
        charcoalFee,
      },
      shipping: {
        location_id: isAdmin ? "" : shippingAddress?.id || "",
        recipient: isAdmin
          ? adminRecipient || "ลูกค้าไม่ได้ระบุชื่อ"
          : shippingAddress?.recipient,
        phone: isAdmin ? adminPhone : shippingAddress?.phone || "",
        address: isAdmin
          ? isMeetup
            ? `[นัดรับ] ${adminAddressDetail}`
            : adminAddressDetail
          : shippingAddress?.address,
        note: isAdmin ? adminAddressDetail : shippingAddress?.details,
        location: isAdmin ? location : shippingAddress?.location,
        feePerSet: deliveryFeePerSet,
        totalFee: shippingFee,
      },
      payment: {
        method: paymentMethod,
        hasSlip: !!slipFile,
      },
      totals: {
        cartTotal,
        addOnTotal,
        shippingFee,
        grandTotal,
      },
    };

    const formData = new FormData();
    formData.append("order", JSON.stringify(orderData));
    formData.append("user_id", userId);

    if (paymentMethod === "promptpay" && slipFile)
      formData.append("slip", slipFile);
    if (homeImageFile) formData.append("home_image", homeImageFile);

    try {
      const token = await getFreshToken();
      await addOrders(formData, token);
      clearCart();
      setSelectedAddOns([]);
      setStoveCount(1);
      setPanCount(1);
      setCharcoalCount(0);
      setSlipPreview(null);
      setSlipFile(null);
      setHomeImageFile(null);

      showPopup(
        "success",
        "สั่งซื้อสำเร็จ!",
        "ยืนยันการสั่งซื้อสำเร็จ! ขอบคุณที่ใช้บริการครับ/ค่ะ 🥢",
        () => {
          navigate("/");
        },
      );
    } catch (error: any) {
      console.error("Error submitting order:", error);
      showPopup(
        "error",
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถส่งคำสั่งซื้อได้",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEquipment = (need: boolean) => {
    setNeedEquipment(need);
    if (!need) {
      setStoveCount(0);
      setPanCount(0);
      setCharcoalCount(0);
    } else {
      setStoveCount(mainItemsCount);
      setPanCount(mainItemsCount);
      setCharcoalCount(0);
    }
  };

  return (
    <div className="h-full overflow-y-auto py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 relative">
      {isPageLoading && <Loading message={"กำลังเตรียมข้อมูลคำสั่งซื้อ..."} />}

      {showMap && (
        <div className="fixed inset-0 z-[110] bg-white">
          <SelectMaps
            isMeetup={isMeetup}
            onLocationConfirm={(lat, lng, fee, dist, meetup) => {
              setLocation({ lat, lng });
              setDeliveryFee(fee);
              setDistance(dist);
              setIsMeetup(meetup);
              setShowMap(false);
              setApplyDeliveryFee(true);
            }}
          />
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg font-bold text-red-500 z-[120] flex items-center gap-1 hover:bg-gray-100"
          >
            ❌
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* หัวหน้าเว็บ */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
            การชำระเงิน
          </h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              ยังไม่มีสินค้าในตะกร้าของคุณ
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span>📍</span> ที่อยู่จัดส่ง / นัดรับ
                </h2>
              </div>

              {isAdmin ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 dark:bg-gray-700/50 p-4 rounded-xl border border-orange-100 dark:border-gray-600">
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                      รูปแบบการรับสินค้า
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isMeetup}
                          onChange={() => {
                            setIsMeetup(false);
                            setLocation(null); // เคลียร์หมุดเมื่อเปลี่ยนรูปแบบ
                            setDistance(0);
                            setDeliveryFee(0);
                          }}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          จัดส่งตามที่อยู่ 🛵
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          checked={isMeetup}
                          onChange={() => {
                            setIsMeetup(true);
                            setLocation(null); // เคลียร์หมุดเมื่อเปลี่ยนรูปแบบ
                            setDistance(0);
                            setDeliveryFee(0);
                          }}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          นัดรับ 🤝
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        ชื่อลูกค้า (ใส่ชื่อเล่นหรือไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น คุณสมชาย"
                        value={adminRecipient}
                        onChange={(e) => setAdminRecipient(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="เช่น 0812345678"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      รายละเอียดที่อยู่ (จำเป็น)
                    </label>
                    <textarea
                      placeholder={
                        isMeetup
                          ? "สถานที่นัดรับ เช่น หน้าโรงเรียน, ปากซอย..."
                          : "บ้านเลขที่, ซอย, จุดสังเกต..."
                      }
                      value={adminAddressDetail}
                      onChange={(e) => setAdminAddressDetail(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white h-24 resize-none"
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="flex items-center gap-3 mb-3 cursor-pointer w-max">
                      <input
                        type="checkbox"
                        checked={applyDeliveryFee}
                        onChange={(e) => setApplyDeliveryFee(e.target.checked)}
                        className="w-5 h-5 text-blue-500 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-bold text-gray-800 dark:text-white">
                        เปิดระบบคำนวณค่าจัดส่ง (ติ๊กเพื่อคิดเงิน / ไม่ติ๊ก =
                        ส่งฟรี)
                      </span>
                    </label>

                    <div
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-xl transition-all ${
                        applyDeliveryFee
                          ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex-1">
                        {location ? (
                          <div>
                            <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                              <span>
                                ✅ ปักหมุดระยะทางเรียบร้อย ระยะ{" "}
                                {distance.toFixed(1)} กม.
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                              {isMeetup ? (
                                <span className="text-purple-600 font-bold">
                                  🤝 ค่าบริการนัดรับ (฿20 x {mainItemsCount}{" "}
                                  ชุด) = ฿{shippingFee}
                                </span>
                              ) : deliveryFee === 0 ? (
                                <span className="text-green-600 font-bold">
                                  🎉 ส่งฟรี
                                </span>
                              ) : (
                                <span className="text-orange-600 font-bold">
                                  💰 ค่าจัดส่ง (฿{deliveryFeePerSet} x{" "}
                                  {mainItemsCount} ชุด) = ฿{shippingFee}
                                </span>
                              )}
                            </p>
                            {!applyDeliveryFee &&
                              deliveryFee > 0 &&
                              !isMeetup && (
                                <p className="text-xs text-red-500 mt-1 font-semibold">
                                  * คุณเลือกไม่คิดค่าจัดส่ง ยอดจัดส่งจะเป็น 0
                                  บาท
                                </p>
                              )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-orange-500 font-medium mb-1">
                              📍 ยังไม่ได้เปิดแผนที่
                            </p>
                            <p className="text-sm">
                              <span
                                className={`font-bold px-2 py-1 rounded-md inline-block ${
                                  applyDeliveryFee
                                    ? "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
                                    : "text-gray-400 bg-gray-200 dark:bg-gray-600 line-through"
                                }`}
                              >
                                💰 ค่าจัดส่ง {deliveryFee} บาท
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowMap(true)}
                        className="px-6 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
                      >
                        {location
                          ? "แก้ไขหมุดแผนที่"
                          : "เปิดแผนที่เพื่อปักหมุด"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : shippingAddress ? (
                <div
                  onClick={() => navigate("/address")}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-orange-400 dark:hover:ring-orange-500 transition-all active:scale-95"
                >
                  <div className="flex-1 mr-4">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {shippingAddress.details || shippingAddress.address}
                    </p>
                    {shippingAddress.location && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-3 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        พิกัด: {shippingAddress.location.lat.toFixed(5)},{" "}
                        {shippingAddress.location.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                  <div className="text-gray-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => navigate("/address")}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 text-center cursor-pointer hover:ring-2 hover:ring-red-400 transition-all"
                >
                  <p className="text-red-500 dark:text-red-400 font-medium">
                    คุณยังไม่ได้ระบุที่อยู่จัดส่ง (กดเพื่อเพิ่มที่อยู่)
                  </p>
                </div>
              )}

              {currentUser?.role === "user" && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
                    อัปโหลดรูปบ้าน (ถ้ามี) 📷
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                      <svg
                        className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        กดเพื่อเลือกรูปบ้าน (ถ้ามี)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHomeImageUpload}
                    />
                  </label>

                  {homeImageFile && (
                    <div className="mt-2 relative">
                      <img
                        src={URL.createObjectURL(homeImageFile)}
                        alt="Home Image Preview"
                        className="w-full max-h-32 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        onClick={() => setHomeImageFile(null)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. สรุปชุดหลัก */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-emerald-500">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                สรุปรายการสั่งซื้อ (ชุดหลัก)
              </h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ราคา: ฿{item.price} / ชุด
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-emerald-500">
                        ฿{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleDecreaseMainItem(item.id, item.quantity)
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-5 text-center dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleIncreaseMainItem(item.id, item.quantity)
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. การ์ดเลือกเมนูเพิ่มเติม */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                รับเพิ่มไหมครับ/คะ? 😋
              </h2>
              {isLoadingAddOns ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  กำลังโหลดเมนูเพิ่มเติม...
                </div>
              ) : addOnMenus.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  ไม่มีเมนูเพิ่มเติมในขณะนี้
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
                  {addOnMenus.map((addon) => {
                    const selectedAddOn = selectedAddOns.find(
                      (item) => item.id === addon.id,
                    );
                    return (
                      <div
                        key={addon.id}
                        className="flex-none w-36 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 snap-start border border-gray-100 dark:border-gray-700 flex flex-col"
                      >
                        <img
                          src={addon.image}
                          alt={addon.name}
                          className="w-full h-24 object-cover rounded-lg mb-3"
                        />
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate mb-1">
                          {addon.name}
                        </h3>
                        <p className="text-emerald-500 font-bold text-sm mb-3">
                          ฿{addon.price}
                        </p>
                        {selectedAddOn ? (
                          <div className="flex items-center justify-between w-full mt-auto bg-emerald-100 dark:bg-gray-600 rounded-lg p-1 px-2">
                            <button
                              onClick={() =>
                                handleUpdateAddOnQuantity(addon.id, -1)
                              }
                              className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-500 rounded text-emerald-600 dark:text-white font-bold shadow-sm hover:scale-105 transition-transform"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-emerald-600 dark:text-white">
                              {selectedAddOn.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateAddOnQuantity(addon.id, 1)
                              }
                              className="w-6 h-6 flex items-center justify-center bg-emerald-500 rounded text-white font-bold shadow-sm hover:scale-105 transition-transform"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddAddOn(addon)}
                            className="w-full mt-auto py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium text-xs rounded-lg transition-colors"
                          >
                            + เพิ่มรายการ
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. สรุปเมนูเพิ่มเติม */}
            {selectedAddOns.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  สรุปรายการสั่งซื้อ (เมนูเพิ่มเติม)
                </h2>
                <div className="space-y-4">
                  {selectedAddOns.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-emerald-50/50 dark:bg-gray-700/50 rounded-xl border border-emerald-100 dark:border-gray-600"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {item.name}
                        </h3>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold text-emerald-500">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleUpdateAddOnQuantity(item.id, -1)
                            }
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold w-4 text-center dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateAddOnQuantity(item.id, 1)
                            }
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isMeetup == true && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  อุปกรณ์สำหรับปิ้งย่าง 🍳
                </h2>
                <div className="flex items-center mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={needEquipment}
                      onChange={(e) => handleToggleEquipment(e.target.checked)}
                      className="w-5 h-5 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer"
                    />
                    <span className="text-gray-800 dark:text-white font-medium">
                      รับเตาและกระทะ (ยืมฟรีตามจำนวนชุด)
                    </span>
                  </label>
                </div>

                {needEquipment && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-down">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div>
                        <span className="block text-gray-800 dark:text-white font-medium">
                          เตาย่าง
                        </span>
                        {stoveCount <= mainItemsCount ? (
                          <span className="block text-xs text-green-500">
                            ยืมฟรี (โควต้า {mainItemsCount} เตา)
                          </span>
                        ) : (
                          <span className="block text-xs text-red-500">
                            + ฿{DEFAULT_STOVE} / เตา (ส่วนเกิน)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setStoveCount((prev) => Math.max(0, prev - 1))
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-4 text-center dark:text-white">
                          {stoveCount}
                        </span>
                        <button
                          onClick={() => setStoveCount((prev) => prev + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:scale-105 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div>
                        <span className="block text-gray-800 dark:text-white font-medium">
                          กระทะ
                        </span>
                        {panCount <= mainItemsCount ? (
                          <span className="block text-xs text-green-500">
                            ยืมฟรี (โควต้า {mainItemsCount} ใบ)
                          </span>
                        ) : (
                          <span className="block text-xs text-red-500">
                            + ฿{DEFAULT_PAN} / ใบ (ส่วนเกิน)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setPanCount((prev) => Math.max(0, prev - 1))
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-4 text-center dark:text-white">
                          {panCount}
                        </span>
                        <button
                          onClick={() => setPanCount((prev) => prev + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:scale-105 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div>
                        <span className="block text-gray-800 dark:text-white font-medium">
                          ถ่าน
                        </span>
                        <span className="block text-xs text-red-500">
                          + ฿{DEFAULT_CHACOAL} / ถุง
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCharcoalCount((prev) => Math.max(0, prev - 1))
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-4 text-center dark:text-white">
                          {charcoalCount}
                        </span>
                        <button
                          onClick={() => setCharcoalCount((prev) => prev + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:scale-105 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. สรุปยอดรวมทั้งหมด */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  ค่าชุดหมูกระทะ
                </span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  ฿{cartTotal.toLocaleString()}
                </span>
              </div>
              {selectedAddOns.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    เมนูเพิ่มเติม
                  </span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    ฿{addOnTotal.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  ค่าส่ง ({mainItemsCount} ชุด x ฿{deliveryFeePerSet})
                </span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  ฿{shippingFee.toLocaleString()}
                </span>
              </div>
              {stoveFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    ค่าเตาย่างเพิ่ม ({extraStoves} เตา)
                  </span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    ฿{stoveFee.toLocaleString()}
                  </span>
                </div>
              )}
              {panFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    ค่ากระทะเพิ่ม ({extraPans} ใบ)
                  </span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    ฿{panFee.toLocaleString()}
                  </span>
                </div>
              )}
              {charcoalCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    ค่าถ่าน ({charcoalCount} ถุง)
                  </span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    ฿{charcoalFee.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800 dark:text-white">
                  ยอดรวมทั้งสิ้น
                </span>
                <span className="text-3xl font-bold text-emerald-500">
                  ฿{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 7. วิธีการชำระเงิน */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                วิธีการชำระเงิน
              </h2>
              <div className="space-y-4">
                <label
                  className={`flex items-center gap-3 p-4 border rounded-xl ${
                    isAdmin
                      ? "bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  } transition-colors ${
                    paymentMethod === "เก็บเงินปลายทาง"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "เก็บเงินปลายทาง"}
                    onChange={() =>
                      !isAdmin && setPaymentMethod("เก็บเงินปลายทาง")
                    }
                    disabled={isAdmin}
                    className="w-5 h-5 text-emerald-500"
                  />
                  <span className="text-gray-800 dark:text-white font-medium">
                    ชำระเงินสดปลายทาง{" "}
                    {isAdmin && (
                      <span className="text-xs text-orange-500 ml-2">
                        (Admin ล็อกตัวเลือกนี้ไว้)
                      </span>
                    )}
                  </span>
                </label>

                {!isAdmin && (
                  <>
                    <label
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                        paymentMethod === "promptpay"
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "promptpay"}
                        onChange={() => setPaymentMethod("promptpay")}
                        className="w-5 h-5 text-emerald-500"
                      />
                      <span className="text-gray-800 dark:text-white font-medium">
                        โอนเงิน / สแกนคิวอาร์โค้ด (PromptPay)
                      </span>
                    </label>

                    {paymentMethod === "promptpay" && (
                      <div className="mt-2 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
                          สแกน QR Code เพื่อชำระเงินจำนวน{" "}
                          <strong className="text-emerald-500 text-lg">
                            ฿{grandTotal.toLocaleString()}
                          </strong>
                        </p>
                        <div className="p-1 rounded-xl shadow-sm mb-4">
                          <img
                            src={MOCK_QR_URL}
                            alt="PromptPay QR Code"
                            className="w-60 h-60 object-contain"
                          />
                        </div>

                        <button
                          onClick={handleDownloadQR}
                          className="mb-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          บันทึก QR Code
                        </button>

                        <p className="text-xs text-red-500 dark:text-red-400 mb-6 text-center max-w-xs">
                          💡 สำหรับผู้ใช้ iPhone/iPad หากดาวน์โหลดไม่สำเร็จ{" "}
                          <br />
                          แนะนำให้{" "}
                          <span className="font-bold underline">
                            กดค้างที่รูปภาพ
                          </span>{" "}
                          แล้วเลือก{" "}
                          <span className="font-bold underline">
                            "บันทึกรูปภาพ"
                          </span>
                        </p>
                        <div className="w-full">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
                            อัปโหลดสลิปหลักฐานการโอนเงิน
                          </label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg
                                className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                กดเพื่อเลือกรูปภาพ หรือ ถ่ายรูปสลิป
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleSlipUpload}
                            />
                          </label>
                          {slipPreview && (
                            <div className="mt-4 relative">
                              <img
                                src={slipPreview}
                                alt="Slip Preview"
                                className="w-full max-h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                              />
                              <button
                                onClick={() => setSlipPreview(null)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ปุ่มยืนยัน */}
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 dark:disabled:bg-emerald-800 text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "กำลังดำเนินการ..."
                : `ยืนยันคำสั่งซื้อและการชำระเงิน (฿${grandTotal.toLocaleString()})`}
            </button>
          </div>
        )}
      </div>

      {isSubmitting && <Loading message={"กำลังดำเนินการ..."} />}

      {popup.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 text-center">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                {popup.type === "success" && (
                  <svg
                    className="h-10 w-10 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {popup.type === "error" && (
                  <svg
                    className="h-10 w-10 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                {popup.type === "warning" && (
                  <svg
                    className="h-10 w-10 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
                {popup.type === "confirm" && (
                  <svg
                    className="h-10 w-10 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {popup.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">
                {popup.message}
              </p>

              <div
                className={`mt-6 flex gap-3 ${
                  popup.type === "confirm" ? "flex-row" : "flex-col"
                }`}
              >
                {popup.type === "confirm" ? (
                  <>
                    <button
                      onClick={popup.onCancel || closePopup}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={popup.onConfirm}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      ยืนยัน
                    </button>
                  </>
                ) : (
                  <button
                    onClick={popup.onConfirm || closePopup}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      popup.type === "success"
                        ? "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500"
                        : popup.type === "error"
                          ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                          : "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
                    }`}
                  >
                    ตกลง
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
