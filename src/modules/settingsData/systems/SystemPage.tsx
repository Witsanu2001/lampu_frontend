/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFreshToken } from "../../../shared/infra/auth/token";

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

interface SpecialHoliday {
  id: string;
  date: string;
  name: string;
}

export default function SystemPage() {
  const navigate = useNavigate();
  
  // 🌟 เพิ่ม State สำหรับหน้าต่างโหลดตอนดึงข้อมูลครั้งแรก
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [storeStatus, setStoreStatus] = useState<"open" | "closed">("open");
  const [openTime, setOpenTime] = useState<string>("08:00");
  const [closeTime, setCloseTime] = useState<string>("18:00");

  const [closedDays, setClosedDays] = useState<Record<DayOfWeek, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: true,
    sunday: true,
  });

  const [specialHolidays, setSpecialHolidays] = useState<SpecialHoliday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState<string>("");
  const [newHolidayName, setNewHolidayName] = useState<string>("");

  const PROJECT_NAME = "thungyai"; // กำหนดชื่อโปรเจกต์ไว้ที่เดียวจะได้แก้ง่าย

  // 🌟 useEffect สำหรับดึงข้อมูลการตั้งค่าเมื่อเปิดหน้านี้
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getFreshToken();
        const response = await fetch(`http://localhost:8080/api/systems/systems?project=${PROJECT_NAME}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();

        // ถ้าสำเร็จและมีข้อมูล ให้เอาข้อมูลจาก API มาใส่ State
        if (response.ok && data.success && data.data) {
          const settings = data.data;
          setIsManualOverride(settings.isManualOverride ?? false);
          setStoreStatus(settings.storeStatus || "open");
          setOpenTime(settings.openTime || "08:00");
          setCloseTime(settings.closeTime || "18:00");
          
          if (settings.closedDays) {
            setClosedDays(settings.closedDays);
          }
          if (settings.specialHolidays) {
            setSpecialHolidays(settings.specialHolidays);
          }
        }
      } catch (error) {
        console.error("Fetch Settings Error:", error);
        // ถ้าดึงข้อมูลไม่ได้ (เช่น Network error หรือ API ล่ม) 
        // ระบบจะใช้ค่าเริ่มต้นที่ตั้งไว้ใน useState โดยอัตโนมัติ
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const toggleDay = (day: DayOfWeek) => {
    setClosedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleAddSpecialHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    const newHoliday: SpecialHoliday = {
      id: Date.now().toString(),
      date: newHolidayDate,
      name: newHolidayName.trim(),
    };

    setSpecialHolidays((prev) =>
      [...prev, newHoliday].sort((a, b) => a.date.localeCompare(b.date)),
    );

    setNewHolidayDate("");
    setNewHolidayName("");
  };

  const handleRemoveSpecialHoliday = (id: string) => {
    setSpecialHolidays((prev) => prev.filter((item) => item.id !== id));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    const payload = {
      project: PROJECT_NAME,
      isManualOverride,
      storeStatus,
      openTime,
      closeTime,
      closedDays,
      specialHolidays,
    };

    try {
      const token = await getFreshToken();
      const response = await fetch("http://localhost:8080/api/systems/systems_add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการบันทึกจากเซิร์ฟเวอร์");
      }

      alert("✅ บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!");
    } catch (error: any) {
      console.error("Save Error:", error);
      alert("❌ ไม่สามารถบันทึกข้อมูลได้: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const daysList: { key: DayOfWeek; label: string }[] = [
    { key: "monday", label: "จันทร์" },
    { key: "tuesday", label: "อังคาร" },
    { key: "wednesday", label: "พุธ" },
    { key: "thursday", label: "พฤหัสบดี" },
    { key: "friday", label: "ศุกร์" },
    { key: "saturday", label: "เสาร์" },
    { key: "sunday", label: "อาทิตย์" },
  ];

  const formatThaiDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${parseInt(year) + 543}`;
  };

  const hoursOptions = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minutesOptions = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const [openHour, openMinute] = openTime.split(":");
  const [closeHour, closeMinute] = closeTime.split(":");

  const CustomTimeDropdown = ({ value, options, onChange, disabled }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg font-bold text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {value}
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
        )}

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 hide-scrollbar">
            {options.map((opt: string) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="px-2 py-2 text-center text-sm font-bold hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 🌟 แสดงหน้าโหลดก่อนถ้าดึงข้อมูลยังไม่เสร็จ
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดการตั้งค่าระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => navigate("/settingsData")}
          className="flex items-center text-2xl text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-2"
        >
          <svg
            className="w-6 h-6 mt-1 mr-2"
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
          ตั้งค่าระบบร้านค้า ⚙️
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
          จัดการสถานะร้าน เวลาทำการ วันหยุดประจำสัปดาห์
          และวันหยุดนักขัตฤกษ์ล่วงหน้า
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              1. Status ร้านค้า (Manual Control)
            </h2>

            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-emerald-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-emerald-500 transition-all"
                  checked={isManualOverride}
                  onChange={(e) => setIsManualOverride(e.target.checked)}
                />
                <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                  ควบคุมสถานะร้านด้วยตัวเอง (Manual Override)
                </span>
              </label>
            </div>

            {isManualOverride ? (
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setStoreStatus("open")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    storeStatus === "open"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-emerald-400 hover:text-white"
                  }`}
                >
                  🟢 เปิดร้าน
                </button>
                <button
                  onClick={() => setStoreStatus("closed")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    storeStatus === "closed"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-400 hover:text-white"
                  }`}
                >
                  🔴 ปิดร้าน
                </button>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20 text-sm flex items-center gap-2">
                <span>ℹ️</span> ระบบกำลังทำงานแบบอัตโนมัติตาม <b>เวลาทำการ</b>{" "}
                และ <b>วันหยุด</b> ที่ตั้งไว้ด้านล่าง
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. ตั้งเวลาเปิด-ปิดร้าน (อัตโนมัติ)
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เวลาเปิดร้าน
                </label>
                <div className="flex items-center gap-2">
                  <CustomTimeDropdown
                    value={openHour}
                    options={hoursOptions}
                    onChange={(val: string) =>
                      setOpenTime(`${val}:${openMinute}`)
                    }
                    disabled={isManualOverride}
                  />
                  <span className="text-2xl font-bold text-gray-400">:</span>
                  <CustomTimeDropdown
                    value={openMinute}
                    options={minutesOptions}
                    onChange={(val: string) =>
                      setOpenTime(`${openHour}:${val}`)
                    }
                    disabled={isManualOverride}
                  />
                  <span className="text-sm font-medium text-gray-500 ml-2">
                    น.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เวลาปิดร้าน
                </label>
                <div className="flex items-center gap-2">
                  <CustomTimeDropdown
                    value={closeHour}
                    options={hoursOptions}
                    onChange={(val: string) =>
                      setCloseTime(`${val}:${closeMinute}`)
                    }
                    disabled={isManualOverride}
                  />
                  <span className="text-2xl font-bold text-gray-400">:</span>
                  <CustomTimeDropdown
                    value={closeMinute}
                    options={minutesOptions}
                    onChange={(val: string) =>
                      setCloseTime(`${closeHour}:${val}`)
                    }
                    disabled={isManualOverride}
                  />
                  <span className="text-sm font-medium text-gray-500 ml-2">
                    น.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              3. วันหยุดทำการประจำสัปดาห์
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              เลือกวันที่จะให้ระบบปิดร้านอัตโนมัติในแต่ละสัปดาห์
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {daysList.map((day) => (
                <button
                  key={day.key}
                  onClick={() => toggleDay(day.key)}
                  disabled={isManualOverride}
                  className={`px-4 py-3 text-sm font-medium rounded-xl border transition-all ${
                    closedDays[day.key]
                      ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  } ${isManualOverride ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {closedDays[day.key] ? "❌ หยุด" : "✅ เปิด"} {day.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              4. วันหยุดนักขัตฤกษ์ / กำหนดวันหยุดล่วงหน้า
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              วางแผนระบุวันปิดร้านล่วงหน้าสำหรับวันหยุดพิเศษหรือเทศกาลต่างๆ
            </p>

            <form
              onSubmit={handleAddSpecialHoliday}
              className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="w-full sm:w-1/3">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  เลือกวันที่หยุด
                </label>
                <input
                  type="date"
                  required
                  disabled={isManualOverride}
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                />
              </div>
              <div className="w-full sm:flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  ชื่อวันหยุด / หมายเหตุ
                </label>
                <input
                  type="text"
                  required
                  disabled={isManualOverride}
                  placeholder="เช่น วันสงกรานต์, ปิดปรับปรุงร้าน"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isManualOverride}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 h-[38px]"
              >
                ➕ เพิ่มวันหยุด
              </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">วันที่หยุด</th>
                    <th className="px-6 py-3">รายการวันหยุด</th>
                    <th className="px-6 py-3 text-center w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {specialHolidays.length > 0 ? (
                    specialHolidays.map((holiday) => (
                      <tr
                        key={holiday.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-gray-900 dark:text-white">
                          {formatThaiDate(holiday.date)}
                        </td>
                        <td className="px-6 py-3.5">{holiday.name}</td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            type="button"
                            disabled={isManualOverride}
                            onClick={() =>
                              handleRemoveSpecialHoliday(holiday.id)
                            }
                            className="text-xs px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors disabled:opacity-50"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-8 text-center text-gray-400 dark:text-gray-500"
                      >
                        ไม่มีการกำหนดวันหยุดล่วงหน้าในขณะนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
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
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            )}
            {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
          </button>
        </div>
      </div>
    </div>
  );
}