/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  settingSysteme,
  systemeAdd,
  systemeCheckPIN,
  systemeUpdatePIN,
} from "../../api/api_setting";
import { CustomTimeDropdown } from "./components/CustomTime";
import { PinTypeOne } from "../../../shared/components/PIN";
import { Loading } from "../../../shared/components/Loading";

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
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [changePinModal, setChangePinModal] = useState<{
    isOpen: boolean;
    step: "old" | "new" | "confirm";
    newPin: string;
    oldPIN: string;
    currentInput: string;
    error: boolean;
  }>({
    isOpen: false,
    step: "old",
    newPin: "",
    oldPIN: "",
    currentInput: "",
    error: false,
  });

  const [isFetching, setIsFetching] = useState<boolean>(true);

  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [storeStatus, setStoreStatus] = useState<"open" | "closed">("open");
  const [openTime, setOpenTime] = useState<string>("08:00");
  const [closeTime, setCloseTime] = useState<string>("18:00");
  const [isConfirmSaveModal, setIsConfirmSaveModal] = useState(false);
  const [savePin, setSavePin] = useState("");
  const [savePinError, setSavePinError] = useState(false);

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

  const PROJECT_NAME = "thungyai";

  useEffect(() => {
    if (!isPinVerified) return;

    const fetchSettings = async () => {
      try {
        const result = await settingSysteme(PROJECT_NAME);
        const settings = result.data;
        setIsManualOverride(settings.isManualOverride ?? false);
        setStoreStatus(settings.storeStatus || "open");
        setOpenTime(settings.openTime || "08:00");
        setCloseTime(settings.closeTime || "18:00");
        setClosedDays(settings.closedDays || {});
        setSpecialHolidays(settings.specialHolidays || []);
      } catch (error) {
        console.error("Fetch Settings Error:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, [isPinVerified]);

  const handlePinPress = async (digit: string) => {
    if (pinError) return;

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 6) {
      setIsVerifying(true);
      try {
        const payload = { project: PROJECT_NAME, PIN: newPin };
        const result = await systemeCheckPIN(payload);
        if (result && result.success) {
          setIsPinVerified(true);
        } else {
          throw new Error("PIN ไม่ถูกต้อง");
        }
      } catch (error) {
        setPinError(true);
        setTimeout(() => {
          setPin("");
          setPinError(false);
        }, 800);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleDeletePin = () => {
    if (pin.length > 0 && !pinError) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleChangePinPress = async (digit: string) => {
    if (changePinModal.error) return;
    const newVal = changePinModal.currentInput + digit;
    setChangePinModal((prev) => ({ ...prev, currentInput: newVal }));
    if (newVal.length === 6) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (changePinModal.step === "old") {
          await systemeCheckPIN({ project: PROJECT_NAME, PIN: newVal });
          setChangePinModal((prev) => ({
            ...prev,
            step: "new",
            oldPIN: newVal,
            currentInput: "",
          }));
        } else if (changePinModal.step === "new") {
          setChangePinModal((prev) => ({
            ...prev,
            step: "confirm",
            newPin: newVal,
            currentInput: "",
          }));
        } else if (changePinModal.step === "confirm") {
          if (newVal !== changePinModal.newPin) {
            throw new Error("รหัสผ่านใหม่ไม่ตรงกัน");
          }
          await systemeUpdatePIN({
            project: PROJECT_NAME,
            oldPIN: changePinModal.oldPIN,
            newPIN: newVal,
          });

          alert("✅ เปลี่ยนรหัส PIN สำเร็จแล้ว!");

          setChangePinModal({
            isOpen: false, // ปิด Modal ตรงนี้ครับ
            step: "old",
            newPin: "",
            oldPIN: "",
            currentInput: "",
            error: false,
          });
        }
      } catch (error: any) {
        setChangePinModal((prev) => ({ ...prev, error: true }));
        setTimeout(() => {
          setChangePinModal((prev) => ({
            ...prev,
            error: false,
            currentInput: "",
          }));
        }, 800);
      }
    }
  };

  const handleDeleteChangePin = () => {
    if (changePinModal.currentInput.length > 0 && !changePinModal.error) {
      setChangePinModal((prev) => ({
        ...prev,
        currentInput: prev.currentInput.slice(0, -1),
      }));
    }
  };

  if (!isPinVerified) {
    return (
      <PinTypeOne
        pin={pin}
        error={pinError}
        title="ยืนยันรหัสผ่าน"
        onNumberPress={handlePinPress}
        onDeletePress={handleDeletePin}
        onClose={() => navigate(-1)}
        loading={isVerifying}
        loadingMessage="กำลังตรวจสอบรหัสผ่าน..."
      />
    );
  }

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

  const handleSave = () => {
    setSavePin("");
    setSavePinError(false);
    setIsConfirmSaveModal(true);
  };

  const handleSavePinPress = async (digit: string) => {
    if (savePinError) return;
    const newPin = savePin + digit;
    setSavePin(newPin);

    if (newPin.length === 6) {
      setIsSaving(true);
      try {
        await systemeCheckPIN({ project: PROJECT_NAME, PIN: newPin });
        const payload = {
          project: PROJECT_NAME,
          isManualOverride,
          storeStatus,
          openTime,
          closeTime,
          closedDays,
          specialHolidays,
          PIN: newPin, // ส่ง PIN ไปยืนยัน
        };

        const result = await systemeAdd(payload);
        if (result.success) {
          alert("✅ บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!");
          setIsConfirmSaveModal(false); // ปิด Modal
        }
      } catch (error: any) {
        setSavePinError(true);
        setTimeout(() => {
          setSavePin(""); // พิมพ์ผิด ล้างค่าให้ลองใหม่
          setSavePinError(false);
        }, 800);
      } finally {
        setIsSaving(false);
      }
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

  return (
    <>
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

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                5. ความปลอดภัย
              </h2>
              <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                    เปลี่ยนรหัส PIN (6 หลัก)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ตั้งค่ารหัส PIN สำหรับเข้าถึงหน้านี้ในครั้งถัดไป
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setChangePinModal({
                      isOpen: true,
                      step: "old",
                      newPin: "",
                      oldPIN: "",
                      currentInput: "",
                      error: false,
                    })
                  }
                  className="px-5 py-2 w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  🔒 เปลี่ยนรหัส PIN
                </button>
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

      {changePinModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-center bg-gray-100 dark:bg-gray-900 sm:bg-black/50 sm:backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md p-8 sm:rounded-3xl rounded-t-3xl shadow-2xl transform transition-transform animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() =>
                  setChangePinModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-2 -ml-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
              <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center flex-1 pr-6">
                เปลี่ยนรหัส PIN
              </h2>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">
              {changePinModal.step === "old" && "1. กรุณากรอกรหัส PIN เดิม"}
              {changePinModal.step === "new" &&
                "2. ตั้งค่ารหัส PIN ใหม่ (6 หลัก)"}
              {changePinModal.step === "confirm" &&
                "3. ยืนยันรหัส PIN ใหม่อีกครั้ง"}
            </p>

            <div
              className={`flex justify-center gap-4 mb-10 transition-all ${changePinModal.error ? "animate-bounce" : ""}`}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    changePinModal.currentInput.length > i
                      ? changePinModal.error
                        ? "bg-red-500 border-red-500 scale-110"
                        : "bg-emerald-500 border-emerald-500 scale-110"
                      : "border-gray-300 dark:border-gray-600 bg-transparent"
                  }`}
                ></div>
              ))}
            </div>

            {changePinModal.error && (
              <p className="text-center text-red-500 text-sm mb-4 font-medium -mt-6">
                {changePinModal.step === "old"
                  ? "รหัสผ่านเดิมไม่ถูกต้อง!"
                  : "รหัสผ่านไม่ตรงกัน!"}
              </p>
            )}

            <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-[280px] mx-auto pb-4 sm:pb-0">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleChangePinPress(num.toString())}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-50 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-800 dark:text-white text-2xl sm:text-3xl font-semibold rounded-full transition-colors flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <div className="w-16 h-16 sm:w-20 sm:h-20"></div>
              <button
                onClick={() => handleChangePinPress("0")}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-50 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-800 dark:text-white text-2xl sm:text-3xl font-semibold rounded-full transition-colors flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleDeleteChangePin}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-500 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:active:bg-gray-600 rounded-full transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmSaveModal && (
        <PinTypeOne
          pin={savePin}
          error={savePinError}
          title="ยืนยัน PIN เพื่อบันทึก"
          onNumberPress={(num) => handleSavePinPress(num)}
          onDeletePress={() => setSavePin(savePin.slice(0, -1))}
          onClose={() => setIsConfirmSaveModal(false)}
          loading={isSaving}
          loadingMessage="กำลังตรวจสอบรหัสผ่าน..."
        />
      )}

      {isFetching && <Loading message={"กำลังโหลดข้อมูล..."} />}
    </>
  );
}
