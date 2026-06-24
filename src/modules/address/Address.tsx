/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import SelectMaps from "./SelectMaps";
import { useNavigate } from "react-router-dom";
import {
  deleteLocationFromDB,
  getLocationsFromDB,
  saveLocationToDB,
  updateLocationInDB,
} from "../api/api_location.ts";

interface AddressItem {
  id: string;
  name: string;
  phone: string;
  details: string;
  note: string;
  location: { lat: number; lng: number } | null;
  deliveryFee: number;
  distance: number;
  isMeetup: boolean;
  isDefault: boolean;
}

export default function Address() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isMeetup, setIsMeetup] = useState<boolean>(false);

  const [showMap, setShowMap] = useState(false);
  const [currentUser] = useState<any>(() => {
    const userDataString = localStorage.getItem("userData");
    return userDataString ? JSON.parse(userDataString) : null;
  });

  useEffect(() => {
    const loadAddresses = async (userId: string) => {
      try {
        const data = await getLocationsFromDB(userId);

        // 🌟 จัดเรียงให้ที่อยู่ "เริ่มต้น" อยู่บนสุดเสมอ
        const sortedData = data.sort(
          (a: AddressItem, b: AddressItem) =>
            (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0),
        );

        setAddresses(sortedData);

        if (sortedData.length > 0) {
          const defaultAddress =
            sortedData.find((a: AddressItem) => a.isDefault) || sortedData[0];
          localStorage.setItem("userAddresses", JSON.stringify(defaultAddress));
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
      }
    };

    if (currentUser) {
      loadAddresses(currentUser.uid || currentUser.id);
    } else {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleMeetupChange = (meetup: boolean) => {
    if (isMeetup !== meetup) {
      setIsMeetup(meetup);
      setLocation(null);
      setDeliveryFee(0);
      setDistance(0);
    }
  };

  const handleSaveAddress = async () => {
    if (!currentUser) return;
    const userId = currentUser.uid || currentUser.id;

    if (
      !recipientName.trim() ||
      !phoneNumber.trim() ||
      !addressDetails.trim() ||
      !location
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนและเลือกตำแหน่งบนแผนที่");
      return;
    }

    // 🌟 ดึงสถานะ isDefault เดิมมาใช้ถ้าเป็นการแก้ไข
    const isCurrentlyDefault = editingId
      ? addresses.find((a) => a.id === editingId)?.isDefault || false
      : addresses.length === 0;

    const newAddress: AddressItem = {
      id: editingId || Date.now().toString(),
      name: recipientName,
      phone: phoneNumber,
      details: addressDetails,
      note: deliveryNote,
      location,
      deliveryFee,
      distance,
      isMeetup,
      isDefault: isCurrentlyDefault,
    };

    try {
      if (editingId) {
        await updateLocationInDB(userId, newAddress);
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingId ? newAddress : addr)),
        );
      } else {
        await saveLocationToDB(userId, newAddress);
        setAddresses((prev) => [...prev, newAddress]);
      }

      if (newAddress.isDefault || addresses.length === 0) {
        localStorage.setItem("userAddresses", JSON.stringify(newAddress));
      }

      resetForm();
    } catch (error) {
      console.error("Error saving address:", error);
      alert("ไม่สามารถบันทึกที่อยู่ได้ กรุณาลองใหม่");
    }
  };

  // 🌟 ฟังก์ชันสำหรับตั้งเป็นที่อยู่เริ่มต้น
  const handleSetDefault = async (address: AddressItem) => {
    if (!currentUser) return;
    const userId = currentUser.uid || currentUser.id;

    try {
      const updatedAddress = { ...address, isDefault: true };

      // อัปเดตในฐานข้อมูล
      await updateLocationInDB(userId, updatedAddress);

      // อัปเดต State หน้าเว็บ (ให้ตัวที่เลือกเป็น true ตัวอื่นเป็น false)
      const newAddresses = addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === address.id,
      }));

      // จัดเรียงให้ตัวที่เป็น Default เด้งขึ้นไปอยู่บนสุด
      newAddresses.sort(
        (a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0),
      );

      setAddresses(newAddresses);

      // อัปเดต LocalStorage เพื่อให้หน้า Payment ดึงไปใช้
      localStorage.setItem("userAddresses", JSON.stringify(updatedAddress));
    } catch (error) {
      console.error("Error setting default address:", error);
      alert("เกิดข้อผิดพลาดในการตั้งที่อยู่เริ่มต้น");
    }
  };

  const handleEdit = (address: AddressItem) => {
    setEditingId(address.id);
    setRecipientName(address.name);
    setPhoneNumber(address.phone);
    setAddressDetails(address.details);
    setDeliveryNote(address.note || "");
    setLocation(address.location);
    setDeliveryFee(address.deliveryFee);
    setDistance(address.distance);
    setIsMeetup(address.isMeetup || false);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser || !window.confirm("คุณต้องการลบที่อยู่นี้ใช่หรือไม่?"))
      return;

    try {
      await deleteLocationFromDB(id); // ส่ง userId ไปด้วยตามที่แก้ api_location ไว้

      const newAddresses = addresses.filter((addr) => addr.id !== id);
      setAddresses(newAddresses);

      if (newAddresses.length > 0) {
        // ถ้าลบตัว Default ไป ให้ตั้งตัวแรกที่เหลือเป็น Default แทน
        const firstAddress = newAddresses[0];
        if (!newAddresses.some((a) => a.isDefault)) {
          handleSetDefault(firstAddress);
        } else {
          const defaultAddress = newAddresses.find((a) => a.isDefault);
          localStorage.setItem("userAddresses", JSON.stringify(defaultAddress));
        }
      } else {
        localStorage.removeItem("userAddresses");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleSelectAddress = (address: AddressItem) => {
    navigate("/orders/payment", { state: { selectedAddress: address } });
  };

  const resetForm = () => {
    setEditingId(null);
    setRecipientName("");
    setPhoneNumber("");
    setAddressDetails("");
    setDeliveryNote("");
    setLocation(null);
    setDeliveryFee(0);
    setDistance(0);
    setIsMeetup(false);
    setShowForm(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 transition-colors text-gray-600 dark:text-gray-300"
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              สมุดที่อยู่ของฉัน
            </h1>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              เพิ่มที่อยู่
            </button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              {editingId ? "✏️ แก้ไขที่อยู่" : "📍 เพิ่มที่อยู่ใหม่"}
            </h2>

            <div className="mb-6 bg-orange-50 dark:bg-gray-700/50 p-4 rounded-xl border border-orange-100 dark:border-gray-600">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                รูปแบบการรับสินค้า
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isMeetup}
                    onChange={() => handleMeetupChange(false)}
                    className="w-5 h-5 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    จัดส่งตามที่อยู่ 🛵
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={isMeetup}
                    onChange={() => handleMeetupChange(true)}
                    className="w-5 h-5 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    นัดรับนอกสถานที่ 🤝
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  ชื่อลูกค้า (ใส่ชื่อเล่นก็ได้){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="เช่น 0812345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                รายละเอียดที่อยู่ <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder={
                  isMeetup
                    ? "สถานที่นัดรับ เช่น หน้าโรงเรียน, ปากซอย..."
                    : "บ้านเลขที่, หมู่บ้าน, ซอย, ถนน..."
                }
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                จุดสังเกต (ไม่บังคับ)
              </label>
              <input
                type="text"
                placeholder="เช่น รั้วสีฟ้า, ตรงข้ามร้านสะดวกซื้อ"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                    พิกัดบนแผนที่ <span className="text-red-500">*</span>
                  </h3>
                  {location ? (
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✅ ปักหมุดเรียบร้อย
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ระยะทาง: {distance.toFixed(1)} กม. |{" "}
                        {isMeetup
                          ? "นัดรับนอกสถานที่"
                          : `ค่าส่ง: ฿${deliveryFee}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 dark:text-red-400">
                      ❌ ยังไม่ได้เลือกพิกัด
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {location ? "เปลี่ยนพิกัด" : "เปิดแผนที่เพื่อปักหมุด"}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition-colors"
              >
                บันทึกที่อยู่
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  ยังไม่มีที่อยู่ที่บันทึกไว้
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  กด "เพิ่มที่อยู่" เพื่อบันทึกที่อยู่จัดส่งของคุณ
                </p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => handleSelectAddress(address)}
                  className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border ${address.isDefault ? "border-orange-400 dark:border-orange-500 ring-1 ring-orange-400 dark:ring-orange-500" : "border-gray-100 dark:border-gray-700"} flex flex-col sm:flex-row gap-4 justify-between items-start`}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {address.name}
                      </h3>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        ({address.phone})
                      </span>
                      {address.isDefault && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold rounded-md flex items-center gap-1">
                          <span>🌟</span> เริ่มต้น
                        </span>
                      )}
                      {address.isMeetup && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-md">
                          นัดรับ
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-1">
                      {address.details}
                    </p>
                    {address.note && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        จุดสังเกต: {address.note}
                      </p>
                    )}

                    {address.location && (
                      <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        ระยะทาง: {address.distance?.toFixed(1)} กม.
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0">
                    {/* 🌟 ปุ่มตั้งเป็นค่าเริ่มต้น */}
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-orange-400 rounded-xl font-medium transition-colors text-sm"
                      >
                        ตั้งเป็นเริ่มต้น
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-blue-400 rounded-xl font-medium transition-colors text-sm"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-red-400 rounded-xl font-medium transition-colors text-sm"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showMap && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-800 flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 bg-white dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              เลือกพิกัด{isMeetup ? "นัดรับ" : "จัดส่ง"}
            </h3>
            <button
              onClick={() => setShowMap(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 w-full relative">
            <SelectMaps
              isMeetup={isMeetup}
              onLocationConfirm={(lat, lng, fee, dist, meetup) => {
                setLocation({ lat, lng });
                setDeliveryFee(fee);
                setDistance(dist);
                setIsMeetup(meetup);
                setShowMap(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
