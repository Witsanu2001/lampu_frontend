// ข้อมูลจำลองสำหรับเมนูหมูกระทะ
const mooKrataMenus = [
  {
    id: 1,
    name: "ชุดหมูจุใจ (S)",
    price: 299,
    description: "หมูสามชั้น, สันคอ, หมูหมักนุ่ม พร้อมชุดผักรวมและวุ้นเส้น",
    image:
      "https://assets.epicurious.com/photos/5c93ede3e6249a2fe87f23c2/16:9/w_5904,h_3321,c_limit/Grilled-Marinated-Leg-of-Lamb-118032019.jpg",
  },
  {
    id: 2,
    name: "ชุดเนื้อพรีเมียม (M)",
    price: 499,
    description:
      "เนื้อสไลด์พรีเมียม, น่องลาย, เสือร้องไห้ พร้อมชุดผักรวมขนาดกลาง",
    image:
      "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=400&h=300",
  },
  {
    id: 3,
    name: "ชุดครอบครัวหรรษา (L)",
    price: 699,
    description: "รวมหมู เนื้อ ทะเล (กุ้ง, ปลาหมึก) พร้อมชุดผักรวมใหญ่จุใจ",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400&h=300",
  },
  {
    id: 4,
    name: "ชุดครอบครัวหรรษา (XL)",
    price: 799,
    description: "รวมหมู เนื้อ ทะเล (กุ้ง, ปลาหมึก) พร้อมชุดผักรวมใหญ่จุใจ",
    image:
      "https://www.seriouseats.com/thmb/DohQC_iADRKgJPdXvcxSjsPA930=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__recipes__images__2016__06__20110516-cowboy-steak-kenji-lopez-alt-bb4a825bd05b4e91b7672bc1603043a8.jpg",
  },
  {
    id: 5,
    name: "ชุดครอบครัวหรรษา (2XL)",
    price: 999,
    description: "รวมหมู เนื้อ ทะเล (กุ้ง, ปลาหมึก) พร้อมชุดผักรวมใหญ่จุใจ",
    image:
      "https://nebraskastarbeef.com/wp-content/uploads/2022/09/52913995_m-scaled.jpg",
  },
  {
    id: 6,
    name: "ชุดครอบครัวหรรษา (3XL)",
    price: 1299,
    description: "รวมหมู เนื้อ ทะเล (กุ้ง, ปลาหมึก) พร้อมชุดผักรวมใหญ่จุใจ",
    image:
      "https://foodal.com/wp-content/uploads/2015/06/Is-Grilling-the-Healthiest-Cooking-Method.jpg",
  },
];

export default function Home() {
  return (
    <div className="h-full overflow-y-auto py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center md:text-left border-l-4 border-orange-500 pl-3">
            เมนูหมูกระทะยอดฮิต 🥢
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {mooKrataMenus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col"
              >
                {/* รูปภาพเมนู */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={menu.image}
                    alt={menu.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                    ฿{menu.price}
                  </div>
                </div>

                {/* รายละเอียดเมนู */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    {menu.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow line-clamp-3">
                    {menu.description}
                  </p>

                  {/* ปุ่มสั่งซื้อ */}
                  <button className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 mt-auto">
                    <span>สั่งชุดนี้</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
