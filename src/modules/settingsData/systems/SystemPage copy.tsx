import React, { useState } from 'react';

// กำหนด Type สำหรับวันทั้ง 7 เพื่อแก้ปัญหา TypeScript
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export default function SystemPage() {
    // State สำหรับเก็บข้อมูลการตั้งค่า พร้อมกำหนด Type
    const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
    const [storeStatus, setStoreStatus] = useState<'open' | 'closed'>('open');
    const [openTime, setOpenTime] = useState<string>('08:00');
    const [closeTime, setCloseTime] = useState<string>('18:00');
    
    // กำหนด Type ให้ Object ของวันหยุด
    const [closedDays, setClosedDays] = useState<Record<DayOfWeek, boolean>>({
        monday: false, tuesday: false, wednesday: false,
        thursday: false, friday: false, saturday: true, sunday: true
    });

    // ฟังก์ชันจัดการเลือกวันหยุด (รับพารามิเตอร์ตาม Type DayOfWeek)
    const toggleDay = (day: DayOfWeek) => {
        setClosedDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

    // ฟังก์ชันสำหรับบันทึกข้อมูล
    const handleSave = () => {
        alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
        console.log({ isManualOverride, storeStatus, openTime, closeTime, closedDays });
    };

    // กำหนด Type ให้กับ daysList
    const daysList: { key: DayOfWeek; label: string }[] = [
        { key: 'monday', label: 'จันทร์' },
        { key: 'tuesday', label: 'อังคาร' },
        { key: 'wednesday', label: 'พุธ' },
        { key: 'thursday', label: 'พฤหัสบดี' },
        { key: 'friday', label: 'ศุกร์' },
        { key: 'saturday', label: 'เสาร์' },
        { key: 'sunday', label: 'อาทิตย์' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-blue-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">ตั้งค่าระบบร้านค้า</h1>
                    <p className="text-sm text-blue-100 mt-1">จัดการสถานะร้าน เวลาทำการ และวันหยุด</p>
                </div>

                <div className="p-6 space-y-8">
                    {/* 1. ส่วนควบคุมการเปิด-ปิดร้าน (Manual vs Auto) */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">1. สถานะร้านค้า (Manual Control)</h2>
                        
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                    checked={isManualOverride}
                                    onChange={(e) => setIsManualOverride(e.target.checked)}
                                />
                                <span className="ml-2 text-gray-700 font-medium">ควบคุมสถานะร้านด้วยตัวเอง (Manual)</span>
                            </label>
                        </div>

                        {isManualOverride ? (
                            <div className="flex gap-4 p-4 bg-gray-100 rounded-lg">
                                <button 
                                    onClick={() => setStoreStatus('open')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-white transition-colors ${storeStatus === 'open' ? 'bg-green-500 shadow-lg' : 'bg-gray-300 hover:bg-green-400 text-gray-700'}`}
                                >
                                    🟢 เปิดร้าน
                                </button>
                                <button 
                                    onClick={() => setStoreStatus('closed')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-white transition-colors ${storeStatus === 'closed' ? 'bg-red-500 shadow-lg' : 'bg-gray-300 hover:bg-red-400 text-gray-700'}`}
                                >
                                    🔴 ปิดร้าน
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                ℹ️ ระบบกำลังทำงานแบบอัตโนมัติตาม <b>เวลาทำการ</b> และ <b>วันหยุด</b> ที่ตั้งไว้ด้านล่าง
                            </div>
                        )}
                    </section>

                    {/* 2. ส่วนตั้งเวลาทำการ */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">2. ตั้งเวลาเปิด-ปิดร้าน (อัตโนมัติ)</h2>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเปิดร้าน</label>
                                <input 
                                    type="time" 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                    value={openTime}
                                    onChange={(e) => setOpenTime(e.target.value)}
                                    disabled={isManualOverride}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาปิดร้าน</label>
                                <input 
                                    type="time" 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                    value={closeTime}
                                    onChange={(e) => setCloseTime(e.target.value)}
                                    disabled={isManualOverride}
                                />
                            </div>
                        </div>
                    </section>

                    {/* 3. ส่วนตั้งวันหยุด */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">3. วันหยุดทำการ</h2>
                        <p className="text-sm text-gray-500">เลือกวันที่จะให้ระบบปิดร้านอัตโนมัติ (วันหยุด)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {daysList.map((day) => (
                                <button
                                    key={day.key}
                                    onClick={() => toggleDay(day.key)}
                                    disabled={isManualOverride}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                        closedDays[day.key] 
                                        ? 'bg-red-50 border-red-200 text-red-700' 
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    } ${isManualOverride ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {closedDays[day.key] ? '❌ หยุด' : '✅ เปิด'} {day.label}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ส่วนปุ่มบันทึก */}
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors"
                    >
                        💾 บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
        </div>
    );
}