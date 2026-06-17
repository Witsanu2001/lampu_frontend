/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useCart } from "../../shared/context/CartContext";
import { useNavigate } from "react-router-dom";
import { addOrders, getAddOnMenus } from "../api/api_order";
import { getFreshToken } from "../../shared/infra/auth/token";

// 🌟 นำเข้าคอมโพเนนต์แผนที่
import SelectMaps from "../address/SelectMaps";

export default function Payment() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();

  const [addOnMenus, setAddOnMenus] = useState<any[]>([]);
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(true);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);

  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 🌟 State สำหรับแอดมินกรอกข้อมูล
  const [adminRecipient, setAdminRecipient] = useState("");
  const [adminPhone, setAdminPhone] = useState(""); // บังคับกรอกเบอร์
  const [adminAddressDetail, setAdminAddressDetail] = useState("");
  
  // 🌟 State สำหรับรับค่าจาก SelectMaps โดยเฉพาะ
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isMeetup, setIsMeetup] = useState<boolean>(false);

  const mainItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [needEquipment, setNeedEquipment] = useState(false);
  const [stoveCount, setStoveCount] = useState(0);
  const [panCount, setPanCount] = useState(0);
  const [charcoalCount, setCharcoalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadMenus = async () => {
      try {
        const token = await getFreshToken();
        const data = await getAddOnMenus(token);
        if (isMounted) {
          setAddOnMenus(data.filter((item: any) => item.available));
          setIsLoadingAddOns(false);
        }
      } catch (err) {
        if (isMounted) setIsLoadingAddOns(false);
      }
    };
    loadMenus();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      setCurrentUser(JSON.parse(userDataString));
    }
    const savedAddress = localStorage.getItem("userAddresses");
    if (savedAddress) {
      const parsedAddress = JSON.parse(savedAddress);
      setShippingAddress(Array.isArray(parsedAddress) && parsedAddress.length > 0 ? parsedAddress[0] : parsedAddress);
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const [paymentMethod, setPaymentMethod] = useState("");

  console.log('xxxxxxxxxxxx',currentUser?.role)

  // ล็อกการชำระเงินเป็นปลายทางเสมอสำหรับแอดมิน
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

  const MOCK_QR_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";

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
      alert("ดาวน์โหลดไม่สำเร็จ กรุณาลองแคปหน้าจอแทนนะครับ");
    }
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipPreview(URL.createObjectURL(file));
      setSlipFile(file);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<File> => {
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
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else {
              reject(new Error("Canvas is empty"));
            }
          }, "image/jpeg", quality);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleHomeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1 * 1024 * 1024) {
        setHomeImageFile(await compressImage(file));
      } else {
        setHomeImageFile(file);
      }
    } catch (error) {
      alert("ไม่สามารถประมวลผลรูปภาพได้");
    }
  };

  const handleAddAddOn = (addon: any) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((item) => item.id === addon.id);
      if (existing) {
        return prev.map((item) => item.id === addon.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...addon, quantity: 1 }];
    });
  };

  const handleUpdateAddOnQuantity = (id: string, amount: number) => {
    setSelectedAddOns((prev) => prev.map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  };

  // 🌟 คำนวณค่าจัดส่ง: ถ้าเป็น Admin เอาค่าจาก SelectMaps, ถ้า User เอาจาก shippingAddress
  const deliveryFeePerSet = isAdmin ? deliveryFee : (shippingAddress?.deliveryFee || shippingAddress?.fee || 0);
  const shippingFee = mainItemsCount * deliveryFeePerSet;

  const addOnTotal = selectedAddOns.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const extraStoves = needEquipment ? Math.max(0, stoveCount - mainItemsCount) : 0;
  const extraPans = needEquipment ? Math.max(0, panCount - mainItemsCount) : 0;
  const stoveFee = extraStoves * 30;
  const panFee = extraPans * 20;
  const charcoalFee = needEquipment ? charcoalCount * 10 : 0;

  const grandTotal = cartTotal + shippingFee + addOnTotal + charcoalFee + stoveFee + panFee;

  const handleConfirmPayment = async () => {
    if (!isAdmin && !shippingAddress) {
      alert("กรุณาเพิ่มที่อยู่จัดส่งก่อนยืนยันคำสั่งซื้อครับ/ค่ะ 📍");
      return;
    }

    const userId = currentUser?.id || currentUser?.uid || "";
    if (!userId) {
      alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้งครับ");
      return;
    }

    // 🌟 Validation บังคับแอดมินกรอกเบอร์โทรและต้องปักหมุด
    if (isAdmin) {
      if (!adminPhone.trim()) {
        alert("กรุณากรอกเบอร์โทรศัพท์ของลูกค้าด้วยครับ");
        return;
      }
      if (!location) {
        alert("กรุณาเปิดแผนที่เพื่อปักหมุดที่อยู่ หรือจุดนัดรับก่อนครับ 📍");
        return;
      }
      if (adminAddressDetail.trim() === "") {
        const confirmProceed = window.confirm("ยังไม่ได้กรอกรายละเอียดที่อยู่ แน่ใจหรือไม่ที่จะไปต่อ?");
        if (!confirmProceed) return;
      }
    }

    if (paymentMethod === "promptpay" && !slipFile && !isAdmin) {
      alert("กรุณาอัปโหลดสลิปหลักฐานการโอนเงินก่อนยืนยันคำสั่งซื้อครับ/ค่ะ");
      return;
    }

    const orderData = {
      mainItems: cart.map((item) => ({
        id: item.id, name: item.name, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity,
      })),
      addOnItems: selectedAddOns.map((item) => ({
        id: item.id, name: item.name, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity,
      })),
      equipment: {
        needEquipment, stoveCount, panCount, charcoalCount,
        extraStoves, extraPans, stoveFee, panFee, charcoalFee,
      },
      shipping: {
        // 🌟 แก้ไขตรงนี้ให้สมบูรณ์ (ไม่มี Error แน่นอน)
        location_id: isAdmin ? "" : (shippingAddress?.id || ""),
        recipient: isAdmin ? (adminRecipient || "ลูกค้าไม่ได้ระบุชื่อ") : shippingAddress?.recipient,
        phone: isAdmin ? adminPhone : (shippingAddress?.phone || ""),
        address: isAdmin ? (isMeetup ? `[นัดรับนอกสถานที่] ${adminAddressDetail}` : adminAddressDetail) : shippingAddress?.address,
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
        cartTotal, addOnTotal, shippingFee, grandTotal,
      },
    };

    const formData = new FormData();
    formData.append("order", JSON.stringify(orderData));
    formData.append("user_id", userId);

    if (paymentMethod === "promptpay" && slipFile) formData.append("slip", slipFile);
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
      alert("ยืนยันการสั่งซื้อสำเร็จ! ขอบคุณที่ใช้บริการครับ/ค่ะ 🥢");
      navigate("/");
    } catch (error: any) {
      console.error("Error submitting order:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message || "ไม่สามารถส่งคำสั่งซื้อได้"}`);
    }
  };

  const handleToggleEquipment = (need: boolean) => {
    setNeedEquipment(need);
    if (!need) {
      setStoveCount(0); setPanCount(0); setCharcoalCount(0);
    } else {
      setStoveCount(mainItemsCount); setPanCount(mainItemsCount); setCharcoalCount(0);
    }
  };

  return (
    <div className="h-full overflow-y-auto py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      
      {/* 🌟 ถ้ากดเปิดแผนที่ ให้แสดง Modal ของ SelectMaps ขึ้นมาทับหน้าจอ */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-white">
          <SelectMaps
            onLocationConfirm={(lat, lng, fee, dist, meetup) => {
              setLocation({ lat, lng });
              setDeliveryFee(fee);
              setDistance(dist);
              setIsMeetup(meetup);
              setShowMap(false); // ปิดหน้าต่างแผนที่หลังจากรับค่าเสร็จ
            }}
          />
          {/* ปุ่มปิดเผื่อแอดมินกดเปิดผิด */}
          <button 
            onClick={() => setShowMap(false)} 
            className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg font-bold text-red-500 z-[60] flex items-center gap-1 hover:bg-gray-100"
          >
            ❌ ปิดแผนที่
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
            การชำระเงิน
          </h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">ยังไม่มีสินค้าในตะกร้าของคุณ</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. ที่อยู่จัดส่ง */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span>📍</span> ที่อยู่จัดส่ง / นัดรับ
                </h2>
              </div>

              {/* 🌟 เช็กว่าเป็น Admin หรือ User ธรรมดา */}
              {isAdmin ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ชื่อลูกค้า (ไม่บังคับ)</label>
                      <input
                        type="text"
                        placeholder="เช่น คุณสมชาย"
                        value={adminRecipient}
                        onChange={(e) => setAdminRecipient(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                      />
                    </div>
                    {/* 🌟 เบอร์โทรศัพท์ บังคับกรอก */}
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">รายละเอียดที่อยู่ (จำเป็น)</label>
                    <textarea
                      placeholder="บ้านเลขที่, ซอย, จุดสังเกต..."
                      value={adminAddressDetail}
                      onChange={(e) => setAdminAddressDetail(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white h-24 resize-none"
                    />
                  </div>

                  {/* 🌟 ปุ่มเปิดแผนที่ SelectMaps สำหรับ Admin */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex-1">
                        {location ? (
                          <div>
                            <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                              <span>✅ ปักหมุดเรียบร้อยแล้ว</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                              ระยะทาง: {(distance || 0).toFixed(1)} กม. |{" "}
                              {isMeetup 
                                ? <span className="text-purple-600 font-bold">🤝 นัดรับนอกสถานที่</span> 
                                : deliveryFee === 0 
                                  ? <span className="text-green-600 font-bold">🎉 ส่งฟรี</span> 
                                  : <span className="text-orange-600 font-bold">💰 ค่าจัดส่ง {deliveryFee} บาท</span>
                              }
                            </p>
                          </div>
                        ) : (
                          <p className="text-orange-500 font-medium">📍 ยังไม่ได้เลือกพิกัดจัดส่ง / จุดนัดรับ</p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowMap(true)}
                        className="px-6 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
                      >
                        {location ? "แก้ไขหมุดแผนที่" : "เปิดแผนที่เพื่อปักหมุด"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ส่วนของลูกค้าธรรมดา (ดึงจาก LocalStorage)
                shippingAddress ? (
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          พิกัด: {shippingAddress.location.lat.toFixed(5)}, {shippingAddress.location.lng.toFixed(5)}
                        </p>
                      )}
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => navigate("/address")}
                    className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 text-center cursor-pointer hover:ring-2 hover:ring-red-400 transition-all"
                  >
                    <p className="text-red-500 dark:text-red-400 font-medium">คุณยังไม่ได้ระบุที่อยู่จัดส่ง (กดเพื่อเพิ่มที่อยู่)</p>
                  </div>
                )
              )}

              {(currentUser?.role === "user") && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">อัปโหลดรูปบ้าน (ถ้ามี) 📷</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                      <svg className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">กดเพื่อเลือกรูปบ้าน (ถ้ามี)</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleHomeImageUpload} />
                  </label>

                  {homeImageFile && (
                    <div className="mt-2 relative">
                      <img src={URL.createObjectURL(homeImageFile)} alt="Home Image Preview" className="w-full max-h-32 object-contain rounded-lg border border-gray-300 dark:border-gray-600" />
                      <button onClick={() => setHomeImageFile(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. สรุปชุดหลัก */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-emerald-500">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">สรุปรายการสั่งซื้อ (ชุดหลัก)</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ราคา: ฿{item.price} / ชุด</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-emerald-500">฿{(item.price * item.quantity).toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDecreaseMainItem(item.id, item.quantity)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                        <span className="text-sm font-semibold w-5 text-center dark:text-white">{item.quantity}</span>
                        <button onClick={() => handleIncreaseMainItem(item.id, item.quantity)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. การ์ดเลือกเมนูเพิ่มเติม */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">รับเพิ่มไหมครับ/คะ? 😋</h2>
              {isLoadingAddOns ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">กำลังโหลดเมนูเพิ่มเติม...</div>
              ) : addOnMenus.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">ไม่มีเมนูเพิ่มเติมในขณะนี้</div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
                  {addOnMenus.map((addon) => {
                    const selectedAddOn = selectedAddOns.find((item) => item.id === addon.id);
                    return (
                      <div key={addon.id} className="flex-none w-36 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 snap-start border border-gray-100 dark:border-gray-700 flex flex-col">
                        <img src={addon.image} alt={addon.name} className="w-full h-24 object-cover rounded-lg mb-3" />
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate mb-1">{addon.name}</h3>
                        <p className="text-emerald-500 font-bold text-sm mb-3">฿{addon.price}</p>
                        {selectedAddOn ? (
                          <div className="flex items-center justify-between w-full mt-auto bg-emerald-100 dark:bg-gray-600 rounded-lg p-1 px-2">
                            <button onClick={() => handleUpdateAddOnQuantity(addon.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-500 rounded text-emerald-600 dark:text-white font-bold shadow-sm hover:scale-105 transition-transform">-</button>
                            <span className="text-sm font-bold text-emerald-600 dark:text-white">{selectedAddOn.quantity}</span>
                            <button onClick={() => handleUpdateAddOnQuantity(addon.id, 1)} className="w-6 h-6 flex items-center justify-center bg-emerald-500 rounded text-white font-bold shadow-sm hover:scale-105 transition-transform">+</button>
                          </div>
                        ) : (
                          <button onClick={() => handleAddAddOn(addon)} className="w-full mt-auto py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium text-xs rounded-lg transition-colors">+ เพิ่มรายการ</button>
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">สรุปรายการสั่งซื้อ (เมนูเพิ่มเติม)</h2>
                <div className="space-y-4">
                  {selectedAddOns.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-emerald-50/50 dark:bg-gray-700/50 rounded-xl border border-emerald-100 dark:border-gray-600">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold text-emerald-500">฿{(item.price * item.quantity).toLocaleString()}</p>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateAddOnQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                          <span className="text-sm font-semibold w-4 text-center dark:text-white">{item.quantity}</span>
                          <button onClick={() => handleUpdateAddOnQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. อุปกรณ์สำหรับปิ้งย่าง */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">อุปกรณ์สำหรับปิ้งย่าง 🍳</h2>
              <div className="flex items-center mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer w-full">
                  <input type="checkbox" checked={needEquipment} onChange={(e) => handleToggleEquipment(e.target.checked)} className="w-5 h-5 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer" />
                  <span className="text-gray-800 dark:text-white font-medium">รับเตาและกระทะ (ยืมฟรีตามจำนวนชุด)</span>
                </label>
              </div>

              {needEquipment && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-down">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div>
                      <span className="block text-gray-800 dark:text-white font-medium">เตาย่าง</span>
                      {stoveCount <= mainItemsCount ? (
                        <span className="block text-xs text-green-500">ยืมฟรี (โควต้า {mainItemsCount} เตา)</span>
                      ) : (
                        <span className="block text-xs text-red-500">+ ฿30 / เตา (ส่วนเกิน)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStoveCount((prev) => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                      <span className="text-sm font-semibold w-4 text-center dark:text-white">{stoveCount}</span>
                      <button onClick={() => setStoveCount((prev) => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:scale-105 transition-transform">+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div>
                      <span className="block text-gray-800 dark:text-white font-medium">กระทะ</span>
                      {panCount <= mainItemsCount ? (
                        <span className="block text-xs text-green-500">ยืมฟรี (โควต้า {mainItemsCount} ใบ)</span>
                      ) : (
                        <span className="block text-xs text-red-500">+ ฿20 / ใบ (ส่วนเกิน)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPanCount((prev) => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                      <span className="text-sm font-semibold w-4 text-center dark:text-white">{panCount}</span>
                      <button onClick={() => setPanCount((prev) => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:scale-105 transition-transform">+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div>
                      <span className="block text-gray-800 dark:text-white font-medium">ถ่าน</span>
                      <span className="block text-xs text-red-500">+ ฿10 / ถุง</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCharcoalCount((prev) => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                      <span className="text-sm font-semibold w-4 text-center dark:text-white">{charcoalCount}</span>
                      <button onClick={() => setCharcoalCount((prev) => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:scale-105 transition-transform">+</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. สรุปยอดรวมทั้งหมด */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">ค่าชุดหมูกระทะ</span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">฿{cartTotal.toLocaleString()}</span>
              </div>
              {selectedAddOns.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">เมนูเพิ่มเติม</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">฿{addOnTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  ค่าส่ง ({mainItemsCount} ชุด x ฿{deliveryFeePerSet})
                </span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">฿{shippingFee.toLocaleString()}</span>
              </div>
              {stoveFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">ค่าเตาย่างเพิ่ม ({extraStoves} เตา)</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">฿{stoveFee.toLocaleString()}</span>
                </div>
              )}
              {panFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">ค่ากระทะเพิ่ม ({extraPans} ใบ)</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">฿{panFee.toLocaleString()}</span>
                </div>
              )}
              {charcoalCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">ค่าถ่าน ({charcoalCount} ถุง)</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">฿{charcoalFee.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800 dark:text-white">ยอดรวมทั้งสิ้น</span>
                <span className="text-3xl font-bold text-emerald-500">฿{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* 7. วิธีการชำระเงิน */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">วิธีการชำระเงิน</h2>
              <div className="space-y-4">
                <label className={`flex items-center gap-3 p-4 border rounded-xl ${isAdmin ? "bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"} transition-colors ${paymentMethod === "เก็บเงินปลายทาง" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-gray-200 dark:border-gray-700"}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "เก็บเงินปลายทาง"}
                    onChange={() => !isAdmin && setPaymentMethod("เก็บเงินปลายทาง")}
                    disabled={isAdmin} // ถ้าเป็น Admin ล็อกตัวเลือกนี้ไว้
                    className="w-5 h-5 text-emerald-500"
                  />
                  <span className="text-gray-800 dark:text-white font-medium">
                    ชำระเงินสดปลายทาง {isAdmin && <span className="text-xs text-orange-500 ml-2">(Admin ล็อกตัวเลือกนี้ไว้)</span>}
                  </span>
                </label>

                {/* ซ่อนการชำระเงินแบบโอน หากผู้ใช้งานเป็น Admin */}
                {!isAdmin && (
                  <>
                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === "promptpay" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                      <input type="radio" name="payment" checked={paymentMethod === "promptpay"} onChange={() => setPaymentMethod("promptpay")} className="w-5 h-5 text-emerald-500" />
                      <span className="text-gray-800 dark:text-white font-medium">โอนเงิน / สแกนคิวอาร์โค้ด (PromptPay)</span>
                    </label>

                    {paymentMethod === "promptpay" && (
                      <div className="ml-8 mt-2 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">สแกน QR Code เพื่อชำระเงินจำนวน <strong className="text-emerald-500 text-lg">฿{grandTotal.toLocaleString()}</strong></p>
                        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                          <img src={MOCK_QR_URL} alt="PromptPay QR Code" className="w-48 h-48 object-contain" />
                        </div>
                        <button onClick={handleDownloadQR} className="mb-6 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-sm font-semibold transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          บันทึก QR Code
                        </button>
                        <div className="w-full">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">อัปโหลดสลิปหลักฐานการโอนเงิน</label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">กดเพื่อเลือกรูปภาพ หรือ ถ่ายรูปสลิป</p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} />
                          </label>
                          {slipPreview && (
                            <div className="mt-4 relative">
                              <img src={slipPreview} alt="Slip Preview" className="w-full max-h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600" />
                              <button onClick={() => setSlipPreview(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              ยืนยันคำสั่งซื้อและการชำระเงิน (฿{grandTotal.toLocaleString()})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}