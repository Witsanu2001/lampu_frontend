/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import SelectLocation from "../SelectLocation";

// 🌟 1. อัปเดตโครงสร้างข้อมูลให้มี ชื่อ, เบอร์โทร, และจุดสังเกต
interface AddressItem {
  id: string;
  name: string;        // ชื่อคนรับ
  phone: string;       // เบอร์โทร
  details: string;     // รายละเอียดที่อยู่
  note: string;        // จุดสังเกต
  location: { lat: number; lng: number } | null;
  isDefault: boolean;
}

export default function Address() {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  
  // State สำหรับจัดการฟอร์ม
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 🌟 2. เพิ่ม State สำหรับฟิลด์ใหม่
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [isDefault, setIsDefault] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const savedAddresses = localStorage.getItem("userAddresses");
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }
  }, []);

  const syncPrimaryAddress = (updatedAddresses: AddressItem[]) => {
    const defaultAddr = updatedAddresses.find((a) => a.isDefault);
    if (defaultAddr) {
      localStorage.setItem("primaryAddress", JSON.stringify(defaultAddr));
    } else if (updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
      localStorage.setItem("primaryAddress", JSON.stringify(updatedAddresses[0]));
    } else {
      localStorage.removeItem("primaryAddress");
    }
    localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses));
  };

  // 🌟 3. อัปเดตฟังก์ชันตอนเปิดฟอร์มให้โหลดข้อมูลใหม่ด้วย
  const handleOpenForm = (addressToEdit?: AddressItem) => {
    if (addressToEdit) {
      setEditingId(addressToEdit.id);
      setRecipientName(addressToEdit.name || "");
      setPhoneNumber(addressToEdit.phone || "");
      setAddressDetails(addressToEdit.details);
      setDeliveryNote(addressToEdit.note || "");
      setLocation(addressToEdit.location);
      setIsDefault(addressToEdit.isDefault);
    } else {
      setEditingId(null);
      setRecipientName("");
      setPhoneNumber("");
      setAddressDetails("");
      setDeliveryNote("");
      setLocation(null);
      setIsDefault(addresses.length === 0);
    }
    setShowForm(true);
    setShowMap(false);
  };

  // 🌟 4. เพิ่มการ Validate ข้อมูลใหม่ตอนกดบันทึก
  const handleSave = () => {
    if (!recipientName.trim()) {
      alert("กรุณากรอกชื่อผู้รับครับ/ค่ะ");
      return;
    }
    if (!phoneNumber.trim()) {
      alert("กรุณากรอกเบอร์โทรศัพท์ครับ/ค่ะ");
      return;
    }
    if (!addressDetails.trim()) {
      alert("กรุณากรอกรายละเอียดที่อยู่ครับ/ค่ะ");
      return;
    }
    if (!location) {
      alert("กรุณาปักหมุดบนแผนที่ครับ/ค่ะ");
      return;
    }

    let updatedAddresses = [...addresses];
    
    // ยัดข้อมูลใหม่ใส่ object
    const newAddress: AddressItem = {
      id: editingId || Date.now().toString(),
      name: recipientName,
      phone: phoneNumber,
      details: addressDetails,
      note: deliveryNote,
      location,
      isDefault,
    };

    if (editingId) {
      updatedAddresses = updatedAddresses.map((addr) =>
        addr.id === editingId ? newAddress : addr
      );
    } else {
      if (updatedAddresses.length >= 3) {
        alert("คุณสามารถเพิ่มที่อยู่ได้สูงสุด 3 แห่งเท่านั้นครับ");
        return;
      }
      updatedAddresses.push(newAddress);
    }

    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === newAddress.id,
      }));
    }

    setAddresses(updatedAddresses);
    syncPrimaryAddress(updatedAddresses);
    setShowForm(false);
    alert("บันทึกที่อยู่เรียบร้อยแล้ว! 📍");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบที่อยู่นี้?")) {
      const updatedAddresses = addresses.filter((addr) => addr.id !== id);
      setAddresses(updatedAddresses);
      syncPrimaryAddress(updatedAddresses);
    }
  };

  const handleSetDefault = (id: string) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    setAddresses(updatedAddresses);
    syncPrimaryAddress(updatedAddresses);
  };

  return (
    <div className="h-full overflow-y-auto py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            ที่อยู่จัดส่งของคุณ
          </h1>
          {!showForm && addresses.length < 3 && (
            <button
              onClick={() => handleOpenForm()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-colors"
            >
              + เพิ่มที่อยู่ใหม่
            </button>
          )}
        </div>

        {/* --- ส่วนแสดงรายการที่อยู่ --- */}
        {!showForm ? (
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 mb-4">คุณยังไม่มีที่อยู่จัดส่ง</p>
                <button
                  onClick={() => handleOpenForm()}
                  className="px-6 py-2 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 font-semibold rounded-lg hover:bg-orange-200 transition-colors"
                >
                  + เพิ่มที่อยู่แรกของคุณ
                </button>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    addr.isDefault
                      ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 shadow-md"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800 dark:text-white">
                        📍 {addr.isDefault ? "ที่อยู่หลัก" : "ที่อยู่จัดส่ง"}
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(addr)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-semibold transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>

                  {/* 🌟 5. แสดง ชื่อ เบอร์โทร รายละเอียด และจุดสังเกต */}
                  <div className="mb-4 text-gray-700 dark:text-gray-300">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      👤 {addr.name} <span className="text-gray-500 font-normal">({addr.phone})</span>
                    </p>
                    <p className="whitespace-pre-wrap">{addr.details}</p>
                    {addr.note && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg inline-block">
                        📌 จุดสังเกต: {addr.note}
                      </p>
                    )}
                  </div>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-sm px-3 py-1.5 border border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 font-semibold rounded-lg transition-colors"
                    >
                      ตั้งเป็นที่อยู่หลัก
                    </button>
                  )}
                </div>
              ))
            )}
            
            {addresses.length >= 3 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                * คุณได้เพิ่มที่อยู่ครบจำนวนสูงสุด (3 แห่ง) แล้ว
              </p>
            )}
          </div>
        ) : (
          
          /* --- ส่วนฟอร์มกรอกที่อยู่ --- */
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              {editingId ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
            </h2>

            {/* 🌟 6. เพิ่มฟิลด์ ชื่อผู้รับ และ เบอร์โทร (จัดแบบ Grid 2 คอลัมน์) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  ชื่อ-นามสกุล ผู้รับ
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                รายละเอียดที่อยู่ (บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด)
              </label>
              <textarea
                rows={3}
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="เช่น 123/45 ซ.สุขุมวิท 1 ถ.สุขุมวิท..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
              />
            </div>

            {/* 🌟 7. เพิ่มฟิลด์ จุดสังเกต */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                คำอธิบายจุดสังเกตในการจัดส่ง (ตัวเลือก)
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="เช่น บ้านรั้วสีฟ้า, ฝากไว้ที่ตึกนิติบุคคล, วางไว้หน้าประตู..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                พิกัดจัดส่ง (บนแผนที่)
              </label>
              {!showMap ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-1">
                    {location ? (
                      <div>
                        <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                          <span>✅ ปักหมุดเรียบร้อยแล้ว</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-orange-500 font-medium">📍 ยังไม่ได้เลือกพิกัดจัดส่ง</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowMap(true)}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {location ? "แก้ไขหมุดแผนที่" : "เปิดแผนที่เพื่อปักหมุด"}
                  </button>
                </div>
              ) : (
                <div className="relative border-2 border-orange-500 rounded-xl overflow-hidden">
                  <SelectLocation
                    onLocationConfirm={(lat, lng) => {
                      setLocation({ lat, lng });
                      setShowMap(false);
                    }}
                  />
                  <button
                    onClick={() => setShowMap(false)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md z-[1000] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={addresses.length === 0} 
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  ตั้งเป็นที่อยู่หลักสำหรับการจัดส่ง
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-lg rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                บันทึกที่อยู่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}