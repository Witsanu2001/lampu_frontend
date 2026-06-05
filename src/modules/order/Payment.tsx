/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useCart } from "../../shared/context/CartContext";

// ข้อมูลจำลองสำหรับเมนูเพิ่มเติม (Add-ons)
const addOnMenus = [
  { id: "addon-1", name: "น้ำโค้ก 1.25L", price: 35, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "addon-2", name: "ยำสาหร่าย", price: 49, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "addon-3", name: "น้ำจิ้มสุกี้", price: 25, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "addon-4", name: "ชุดผักรวม", price: 39, image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "addon-5", name: "ลูกชิ้นรวมมิตร", price: 49, image: "https://images.unsplash.com/photo-1527004013197-933c4bcc61f4?auto=format&fit=crop&q=80&w=200&h=200" },
];

export default function Payment() {
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);

  // โควต้าและการเลือกอุปกรณ์
  const mainItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [stoveCount, setStoveCount] = useState(1);
  const [panCount, setPanCount] = useState(1);
  const [charcoalCount, setCharcoalCount] = useState(0);

  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (mainItemsCount > 0 && !isInitialized) {
      setStoveCount(mainItemsCount);
      setPanCount(mainItemsCount);
      setIsInitialized(true);
    }
  }, [mainItemsCount, isInitialized]);

  // 🌟 State สำหรับการชำระเงิน
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  // รูป QR Code จำลอง (สามารถเปลี่ยนเป็น URL รูปของร้านได้เลย)
  const MOCK_QR_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";

  // ฟังก์ชันดาวน์โหลด QR Code ให้รองรับทุกแพลตฟอร์ม
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(MOCK_QR_URL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Lampu-MooKrata-QR.png"; // ชื่อไฟล์ที่จะถูกบันทึก
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("ดาวน์โหลดไม่สำเร็จ กรุณาลองแคปหน้าจอแทนนะครับ");
    }
  };

  // ฟังก์ชันจัดการการอัปโหลดสลิป
  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSlipPreview(previewUrl);
    }
  };

  // จัดการเมนูเพิ่มเติม
  const handleAddAddOn = (addon: any) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((item) => item.id === addon.id);
      if (existing) {
        return prev.map((item) =>
          item.id === addon.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...addon, quantity: 1 }];
    });
  };

  const handleUpdateAddOnQuantity = (id: string, amount: number) => {
    setSelectedAddOns((prev) => {
      return prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + amount } : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  // การคำนวณยอดเงิน
  const shippingFee = mainItemsCount * 10;
  const addOnTotal = selectedAddOns.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const extraStoves = Math.max(0, stoveCount - mainItemsCount);
  const extraPans = Math.max(0, panCount - mainItemsCount);
  const stoveFee = extraStoves * 30;
  const panFee = extraPans * 20;
  const charcoalFee = charcoalCount * 10;

  const grandTotal = cartTotal + shippingFee + addOnTotal + charcoalFee + stoveFee + panFee;

  const handleConfirmPayment = () => {
    if (paymentMethod === "promptpay" && !slipPreview) {
      alert("กรุณาอัปโหลดสลิปหลักฐานการโอนเงินก่อนยืนยันคำสั่งซื้อครับ/ค่ะ");
      return;
    }

    clearCart();
    setSelectedAddOns([]);
    setStoveCount(1);
    setPanCount(1);
    setCharcoalCount(0);
    setSlipPreview(null);
    alert("ยืนยันการสั่งซื้อสำเร็จ! ขอบคุณที่ใช้บริการครับ/ค่ะ 🥢");
    window.location.href = "/";
  };

  return (
    <div className="h-full overflow-y-auto py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          การชำระเงิน
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              ยังไม่มีสินค้าในตะกร้าของคุณ
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. สรุปชุดหลัก */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                สรุปรายการสั่งซื้อ (ชุดหลัก)
              </h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ราคา: ฿{item.price} / ชุด</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-orange-500">฿{(item.price * item.quantity).toLocaleString()}</p>
                      {updateQuantity && removeFromCart && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                          <span className="text-sm font-semibold w-5 text-center dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. สรุปเมนูเพิ่มเติม (ถ้ามี) */}
            {selectedAddOns.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">สรุปรายการสั่งซื้อ (เมนูเพิ่มเติม)</h2>
                <div className="space-y-4">
                  {selectedAddOns.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-orange-50/50 dark:bg-gray-700/50 rounded-xl border border-orange-100 dark:border-gray-600">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold text-orange-500">฿{(item.price * item.quantity).toLocaleString()}</p>
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

            {/* 3. การ์ดเลือกเมนูเพิ่มเติม */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">รับเพิ่มไหมครับ/คะ? 😋</h2>
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
                {addOnMenus.map((addon) => {
                  const selectedAddOn = selectedAddOns.find(item => item.id === addon.id);
                  return (
                    <div key={addon.id} className="flex-none w-36 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 snap-start border border-gray-100 dark:border-gray-700 flex flex-col">
                      <img src={addon.image} alt={addon.name} className="w-full h-24 object-cover rounded-lg mb-3" />
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate mb-1">{addon.name}</h3>
                      <p className="text-orange-500 font-bold text-sm mb-3">฿{addon.price}</p>
                      {selectedAddOn ? (
                        <div className="flex items-center justify-between w-full mt-auto bg-orange-100 dark:bg-gray-600 rounded-lg p-1 px-2">
                          <button onClick={() => handleUpdateAddOnQuantity(addon.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-500 rounded text-orange-600 dark:text-white font-bold shadow-sm hover:scale-105 transition-transform">-</button>
                          <span className="text-sm font-bold text-orange-600 dark:text-white">{selectedAddOn.quantity}</span>
                          <button onClick={() => handleUpdateAddOnQuantity(addon.id, 1)} className="w-6 h-6 flex items-center justify-center bg-orange-500 rounded text-white font-bold shadow-sm hover:scale-105 transition-transform">+</button>
                        </div>
                      ) : (
                        <button onClick={() => handleAddAddOn(addon)} className="w-full mt-auto py-1.5 bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/40 text-orange-600 dark:text-orange-400 font-medium text-xs rounded-lg transition-colors">+ เพิ่มรายการ</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. อุปกรณ์สำหรับปิ้งย่าง */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">อุปกรณ์สำหรับปิ้งย่าง 🍳</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <span className="block text-gray-800 dark:text-white font-medium">เตาย่าง</span>
                    {stoveCount <= mainItemsCount ? (
                      <span className="block text-xs text-green-500">ยืมฟรี (โควต้า {mainItemsCount} เตา)</span>
                    ) : (
                      <span className="block text-xs text-orange-500">+ ฿30 / เตา (ส่วนเกิน)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStoveCount(prev => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                    <span className="text-sm font-semibold w-4 text-center dark:text-white">{stoveCount}</span>
                    <button onClick={() => setStoveCount(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded shadow-sm hover:scale-105 transition-transform">+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <span className="block text-gray-800 dark:text-white font-medium">กระทะ</span>
                    {panCount <= mainItemsCount ? (
                      <span className="block text-xs text-green-500">ยืมฟรี (โควต้า {mainItemsCount} ใบ)</span>
                    ) : (
                      <span className="block text-xs text-orange-500">+ ฿20 / ใบ (ส่วนเกิน)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPanCount(prev => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                    <span className="text-sm font-semibold w-4 text-center dark:text-white">{panCount}</span>
                    <button onClick={() => setPanCount(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded shadow-sm hover:scale-105 transition-transform">+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <span className="block text-gray-800 dark:text-white font-medium">ถ่าน</span>
                    <span className="block text-xs text-orange-500">+ ฿10 / ถุง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCharcoalCount(prev => Math.max(0, prev - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white">-</button>
                    <span className="text-sm font-semibold w-4 text-center dark:text-white">{charcoalCount}</span>
                    <button onClick={() => setCharcoalCount(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded shadow-sm hover:scale-105 transition-transform">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. สรุปยอดรวมทั้งหมด */}
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
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">ค่าส่ง ({mainItemsCount} ชุด)</span>
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
                <span className="text-3xl font-bold text-orange-500">฿{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* 6. วิธีการชำระเงิน */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                วิธีการชำระเงิน
              </h2>
              <div className="space-y-4">
                
                {/* ตัวเลือก: โอนเงิน / PromptPay */}
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === "promptpay" ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                  <input type="radio" name="payment" checked={paymentMethod === "promptpay"} onChange={() => setPaymentMethod("promptpay")} className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-800 dark:text-white font-medium">โอนเงิน / สแกนคิวอาร์โค้ด (PromptPay)</span>
                </label>

                {/* 🌟 ส่วนแสดง QR Code และ อัปโหลดสลิป (จะแสดงเมื่อเลือก PromptPay) */}
                {paymentMethod === "promptpay" && (
                  <div className="ml-8 mt-2 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">สแกน QR Code เพื่อชำระเงินจำนวน <strong className="text-orange-500 text-lg">฿{grandTotal.toLocaleString()}</strong></p>
                    
                    {/* รูป QR Code */}
                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                      <img src={MOCK_QR_URL} alt="PromptPay QR Code" className="w-48 h-48 object-contain" />
                    </div>

                    {/* ปุ่มเซฟ QR Code ลงเครื่อง */}
                    <button 
                      onClick={handleDownloadQR}
                      className="mb-6 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      บันทึก QR Code
                    </button>

                    {/* กล่องอัปโหลดสลิป */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">อัปโหลดสลิปหลักฐานการโอนเงิน</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">กดเพื่อเลือกรูปภาพ หรือ ถ่ายรูปสลิป</p>
                        </div>
                        {/* ซ่อน input แบบไฟล์ไว้ แล้วใช้ Label ครอบเพื่อให้ดีไซน์สวย */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} />
                      </label>

                      {/* แสดงรูปสลิปเมื่ออัปโหลดแล้ว */}
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

                {/* ตัวเลือก: เงินสดปลายทาง */}
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                  <input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-800 dark:text-white font-medium">ชำระเงินสดปลายทาง</span>
                </label>

              </div>
            </div>

            {/* ปุ่มยืนยัน */}
            <button
              onClick={handleConfirmPayment}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              ยืนยันคำสั่งซื้อและการชำระเงิน (฿{grandTotal.toLocaleString()})
            </button>

          </div>
        )}
      </div>
    </div>
  );
}