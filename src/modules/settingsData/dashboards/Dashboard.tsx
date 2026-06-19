import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ==========================================
// 1. Component อนิเมชันตัวเลขวิ่ง (สมูทสไตล์ Minimal)
// ==========================================
const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 800; // ความเร็ววิ่ง 0.8 วินาที
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * (value - startValue) + startValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
};

// ==========================================
// 2. Component อนิเมชันเลื่อนแล้วเฟดขึ้น (Fade Up)
// ==========================================
const FadeUpCard = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.05 },
    );

    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ==========================================
// 3. Types และโครงสร้างข้อมูลสัปดาห์/วัน
// ==========================================
type TimeRange = "1day" | "week1" | "week2" | "week3" | "1month";
type Category = "all" | "set300" | "set500";

// ข้อมูลจำลองรายวัน (Mock Data Day 1 - 31) เพื่อให้กดรายวันแล้วยอดเปลี่ยนจริง
const generateDailyMockData = (day: number) => {
  // สุ่ม/ล็อกค่าจำลองไว้ตามจริง (เช่น วันที่ 15+ ยังไม่เกิดขึ้นจะส่งค่าเป็น 0)
  if (day > 14) {
    return {
      set300: { sales: 0, count: 0 },
      set500: { sales: 0, count: 0 },
      payment: { cod: 0, transfer: 0 },
    };
  }
  // ข้อมูลจำลองวันปกติที่เกิดขึ้นแล้ว (1-14)
  return {
    set300: { sales: 3000 + (day % 3) * 600, count: 10 + (day % 3) * 2 },
    set500: { sales: 5000 + (day % 2) * 1000, count: 10 + (day % 2) * 2 },
    payment: { cod: 8 + (day % 2), transfer: 12 + (day % 3) },
  };
};

const mockData = {
  "1day": {
    set300: { sales: 4500, count: 15 },
    set500: { sales: 6000, count: 12 },
    payment: { cod: 10, transfer: 17 },
  },
  week1: {
    set300: { sales: 35000, count: 116 },
    set500: { sales: 55000, count: 110 },
    payment: { cod: 85, transfer: 141 },
  },
  week2: {
    set300: { sales: 12500, count: 41 },
    set500: { sales: 16000, count: 31 },
    payment: { cod: 26, transfer: 46 },
  },
  week3: {
    set300: { sales: 0, count: 0 },
    set500: { sales: 0, count: 0 },
    payment: { cod: 0, transfer: 0 },
  },
  "1month": {
    set300: { sales: 135000, count: 450 },
    set500: { sales: 210000, count: 420 },
    payment: { cod: 320, transfer: 550 },
  },
  lastMonth: {
    set300: { sales: 120000, count: 400 },
    set500: { sales: 195000, count: 390 },
    payment: { cod: 290, transfer: 500 },
  },
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1day");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const navigate = useNavigate();

  // 🌟 ดึงข้อมูลวันและเวลาปัจจุบันมาใช้โดยตรง (ไม่ใช้ state/effect เพื่อป้องกัน Render Loop)
  const now = new Date();
  const currentDay = now.getDate(); // เช่น วันที่ 14
  const currentHour = now.getHours(); // เช็คชั่วโมงสำหรับตัดยอด 21:00 (3 ทุ่ม)

  // เงื่อนไขเปิด-ปิดปุ่ม Week หลัก
  const isWeek2Available =
    currentDay > 11 || (currentDay === 11 && currentHour >= 21);
  const isWeek3Available =
    currentDay > 21 || (currentDay === 21 && currentHour >= 21);

  // สลับไปหน้าสัปดาห์อัตโนมัติเมื่อกดเปลี่ยนกลุ่มสัปดาห์
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setSelectedDay(null); // รีเซ็ตการเลือกวันย่อยเมื่อเปลี่ยนสัปดาห์
  };

  // ดึงข้อมูลหลักตามตัวกรอง (สัปดาห์รวม หรือ รายวันย่อย)
  let currentData = mockData[timeRange];
  if (selectedDay !== null) {
    currentData = generateDailyMockData(selectedDay);
  }

  // คำนวณผลรวมยอดขายและออเดอร์ตามประเภทสินค้า
  let totalSales = 0;
  let totalCount = 0;
  if (category === "all") {
    totalSales = currentData.set300.sales + currentData.set500.sales;
    totalCount = currentData.set300.count + currentData.set500.count;
  } else if (category === "set300") {
    totalSales = currentData.set300.sales;
    totalCount = currentData.set300.count;
  } else if (category === "set500") {
    totalSales = currentData.set500.sales;
    totalCount = currentData.set500.count;
  }

  // คำนวณข้อมูลเปรียบเทียบกับเดือนก่อนหน้า (Last Month)
  const lastMonthData = mockData["lastMonth"];
  let lastMonthTotalSales =
    lastMonthData.set300.sales + lastMonthData.set500.sales;
  if (category === "set300") lastMonthTotalSales = lastMonthData.set300.sales;
  if (category === "set500") lastMonthTotalSales = lastMonthData.set500.sales;

  const monthSalesDiff = totalSales - lastMonthTotalSales;
  const monthGrowthRate =
    ((totalSales - lastMonthTotalSales) / (lastMonthTotalSales || 1)) * 100;

  // ฟังก์ชันช่วยเจเนอเรตปุ่มวันย่อยในแต่ละ Week
  const renderDateButtons = () => {
    let days: number[] = [];
    if (timeRange === "week1") days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (timeRange === "week2") days = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    if (timeRange === "week3") days = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

    if (days.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          เจาะลึกรายวันในสัปดาห์
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDay === null
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300"
            }`}
          >
            รวมทั้งสัปดาห์
          </button>
          {days.map((day) => {
            // 🌟 เงื่อนไขเช็ควันล็อกล่วงหน้า: ถ้าวันนั้นมากกว่าวันปัจจุบัน หรือเป็นวันตัดยอดแต่ยังไม่ถึง 3 ทุ่ม
            const isFuture = day > currentDay;
            if (
              day === currentDay &&
              currentHour < 21 &&
              (day === 11 || day === 21)
            ) {
              // กรณีพิเศษ: ถ้าเป็นวันตัดยอดหลักแต่ยังไม่ 21:00 น. ก็ให้คงสถานะไว้ได้ตามเงื่อนไขทางธุรกิจของคุณ
            }

            return (
              <button
                key={day}
                disabled={isFuture}
                onClick={() => setSelectedDay(day)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === day
                    ? "bg-emerald-500 text-white shadow-sm"
                    : isFuture
                      ? "opacity-20 cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 font-sans text-gray-800 dark:text-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Global Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div>
            <button
              onClick={() => navigate("/settingsData")}
              className="flex items-center text-2xl text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-3"
            >
              <svg
                className="w-6 h-6 mt-1"
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
              แดชบอร์ดข้อมูลออเดอร์ 📈
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* ตัวกรองช่วงเวลาหลัก */}
            <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-0.5 w-full lg:w-auto">
              <button
                onClick={() => handleTimeRangeChange("1day")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === "1day" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-gray-500 hover:text-gray-800"}`}
              >
                วันนี้
              </button>
              <button
                onClick={() => handleTimeRangeChange("week1")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === "week1" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-gray-500 hover:text-gray-800"}`}
              >
                Week 1 (1-11)
              </button>
              <button
                disabled={!isWeek2Available}
                onClick={() => handleTimeRangeChange("week2")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === "week2" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : !isWeek2Available ? "opacity-20 cursor-not-allowed text-gray-400" : "text-gray-500"}`}
              >
                Week 2 (12-21)
              </button>
              <button
                disabled={!isWeek3Available}
                onClick={() => handleTimeRangeChange("week3")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === "week3" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : !isWeek3Available ? "opacity-20 cursor-not-allowed text-gray-400" : "text-gray-500"}`}
              >
                Week 3 (22+)
              </button>
              <button
                onClick={() => handleTimeRangeChange("1month")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === "1month" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-gray-500 hover:text-gray-800"}`}
              >
                เดือนนี้
              </button>
            </div>

            {/* หมวดหมู่ประเภทชุดหมูกระทะ */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs rounded-xl px-3 py-2 shadow-sm outline-none cursor-pointer font-medium"
            >
              <option value="all">แสดงทุกชุดเมนู</option>
              <option value="set300">เฉพาะชุด 300.-</option>
              <option value="set500">เฉพาะชุด 500.-</option>
            </select>
          </div>
        </div>

        {/* 🌟 แสดงแผงปุ่มรายวันย่อยยามเลือกกลุ่ม Week */}
        {renderDateButtons()}

        {/* 🌟 4 Cards ตัวชี้วัดยอดหลัก */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FadeUpCard delay={0}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                ยอดขายรวมรอบนี้
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                ฿<AnimatedNumber value={totalSales} />
              </h3>
            </div>
          </FadeUpCard>

          <FadeUpCard delay={50}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                จำนวนออเดอร์ทั้งหมด
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                <AnimatedNumber value={totalCount} />{" "}
                <span className="text-sm font-normal text-gray-400">ชุด</span>
              </h3>
            </div>
          </FadeUpCard>

          <FadeUpCard delay={100}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                ชำระเงินปลายทาง (COD)
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                <AnimatedNumber value={currentData.payment.cod} />{" "}
                <span className="text-sm font-normal text-gray-400">ราย</span>
              </h3>
            </div>
          </FadeUpCard>

          <FadeUpCard delay={150}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                โอนเงินเข้าบัญชี
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                <AnimatedNumber value={currentData.payment.transfer} />{" "}
                <span className="text-sm font-normal text-gray-400">ราย</span>
              </h3>
            </div>
          </FadeUpCard>
        </div>

        {/* 🌟 5. Section เปรียบเทียบกับเดือนก่อนหน้าอย่างชัดเจน (ตามคำขอ) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FadeUpCard delay={200}>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white dark:from-gray-800 dark:to-gray-700 rounded-3xl p-6 shadow-md space-y-4 flex flex-col justify-between">
              <div>
                <span className="bg-white/10 text-white/80 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md">
                  Performance Compare
                </span>
                <h3 className="text-lg font-bold mt-3">
                  วิเคราะห์เทียบเดือนก่อนหน้า
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  เปรียบเทียบยอดรวมปัจจุบันกับเดือนที่ผ่านมาในหมวดหมู่เดียวกัน
                </p>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">ยอดรวมเดือนนี้:</span>
                  <span className="font-bold text-emerald-400">
                    ฿{totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">ยอดรวมเดือนก่อน:</span>
                  <span className="font-semibold text-white/90">
                    ฿{lastMonthTotalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                  <span className="text-white/60">ส่วนต่างสุทธิ:</span>
                  <span
                    className={`font-bold ${monthSalesDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {monthSalesDiff >= 0
                      ? `+฿${monthSalesDiff.toLocaleString()}`
                      : `-฿${Math.abs(monthSalesDiff).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div
                className={`mt-2 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${monthGrowthRate >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
              >
                <span>อัตราการเติบโต (Growth Rate)</span>
                <span className="text-sm font-bold">
                  {monthGrowthRate >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(monthGrowthRate).toFixed(1)}%
                </span>
              </div>
            </div>
          </FadeUpCard>

          {/* สัดส่วนตามเซ็ตเมนู */}
          <div className="lg:col-span-2">
            <FadeUpCard delay={250}>
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col justify-center">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">
                  สัดส่วนแยกตามชุดเมนูหมูกระทะ
                </h3>
                <div className="space-y-5">
                  <div
                    className={`transition-all ${category === "set500" ? "opacity-25" : "opacity-100"}`}
                  >
                    <div className="flex justify-between items-end mb-1.5">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-base">
                          ชุดหมูกระทะราคา 300.-
                        </p>
                        <p className="text-xs text-gray-400">
                          ทำยอดได้รวม{" "}
                          <AnimatedNumber value={currentData.set300.count} />{" "}
                          เซ็ต
                        </p>
                      </div>
                      <p className="font-bold text-base text-emerald-500">
                        ฿<AnimatedNumber value={currentData.set300.sales} />
                      </p>
                    </div>
                    <div className="w-full bg-gray-50 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(currentData.set300.sales / (currentData.set300.sales + currentData.set500.sales || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div
                    className={`transition-all ${category === "set300" ? "opacity-25" : "opacity-100"}`}
                  >
                    <div className="flex justify-between items-end mb-1.5">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-base">
                          ชุดหมูกระทะราคา 500.-
                        </p>
                        <p className="text-xs text-gray-400">
                          ทำยอดได้รวม{" "}
                          <AnimatedNumber value={currentData.set500.count} />{" "}
                          เซ็ต
                        </p>
                      </div>
                      <p className="font-bold text-base text-emerald-500">
                        ฿<AnimatedNumber value={currentData.set500.sales} />
                      </p>
                    </div>
                    <div className="w-full bg-gray-50 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(currentData.set500.sales / (currentData.set300.sales + currentData.set500.sales || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUpCard>
          </div>
        </div>
      </div>
    </div>
  );
}
