// src/modules/order/Order.tsx

type OrderStatus =
  | "new"
  | "pending"
  | "preparing"
  | "ready"
  | "shipping"
  | "delivered";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  customerName: string;
  address: string;
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    status: "new",
    date: "10/06/2026 14:30",
    items: [
      { name: "หมูกระทะเซ็ต A", quantity: 2, price: 350 },
      { name: "ผักสดเซ็ต", quantity: 1, price: 80 },
      { name: "น้ำจิ้มรสเด็ด", quantity: 2, price: 40 },
    ],
    total: 810,
    customerName: "สมชาย ใจดี",
    address: "123 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ",
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    status: "pending",
    date: "10/06/2026 13:45",
    items: [
      { name: "หมูกระทะเซ็ต B", quantity: 1, price: 450 },
      { name: "ไข่ไก่", quantity: 6, price: 30 },
    ],
    total: 630,
    customerName: "วิภา สุขใจ",
    address: "456 ถ.พระราม 4 แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ",
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    status: "preparing",
    date: "10/06/2026 12:20",
    items: [
      { name: "หมูกระทะเซ็ต A", quantity: 1, price: 350 },
      { name: "หมูสับ", quantity: 2, price: 120 },
      { name: "เกาเหลาหมู", quantity: 1, price: 90 },
    ],
    total: 680,
    customerName: "นาย รักเรียน",
    address: "789 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพฯ",
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    status: "ready",
    date: "10/06/2026 11:00",
    items: [
      { name: "หมูกระทะเซ็ต C", quantity: 1, price: 550 },
      { name: "ผักสดเซ็ต", quantity: 2, price: 80 },
      { name: "น้ำจิ้มรสเด็ด", quantity: 1, price: 40 },
    ],
    total: 750,
    customerName: "สมหญิง มีสุข",
    address: "321 ถ.เพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ",
  },
  {
    id: "5",
    orderNumber: "ORD-005",
    status: "shipping",
    date: "10/06/2026 10:30",
    items: [
      { name: "หมูกระทะเซ็ต A", quantity: 3, price: 350 },
      { name: "เกาเหลาหมู", quantity: 2, price: 90 },
    ],
    total: 1230,
    customerName: "ประยุทธ์ จริงใจ",
    address: "654 ถ.อโศก แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ",
  },
  {
    id: "6",
    orderNumber: "ORD-006",
    status: "delivered",
    date: "09/06/2026 19:45",
    items: [
      { name: "หมูกระทะเซ็ต B", quantity: 1, price: 450 },
      { name: "ผักสดเซ็ต", quantity: 1, price: 80 },
    ],
    total: 530,
    customerName: "มานี รักษ์ดี",
    address: "987 ถ.สุขุมวิท แขวงพระโขงง เขตเขตพระโขงง กรุงเทพฯ",
  },
];

const getStatusConfig = (status: OrderStatus) => {
  const configs = {
    new: {
      label: "ออเดอร์ใหม่",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-800 dark:text-blue-200",
      borderColor: "border-blue-300 dark:border-blue-700",
    },
    pending: {
      label: "รอยืนยัน",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      textColor: "text-yellow-800 dark:text-yellow-200",
      borderColor: "border-yellow-300 dark:border-yellow-700",
    },
    preparing: {
      label: "กำลังเตรียมออเดอร์",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      textColor: "text-orange-800 dark:text-orange-200",
      borderColor: "border-orange-300 dark:border-orange-700",
    },
    ready: {
      label: "พร้อมส่ง",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-800 dark:text-purple-200",
      borderColor: "border-purple-300 dark:border-purple-700",
    },
    shipping: {
      label: "กำลังไปส่ง",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      textColor: "text-indigo-800 dark:text-indigo-200",
      borderColor: "border-indigo-300 dark:border-indigo-700",
    },
    delivered: {
      label: "ส่งสำเร็จ",
      bgColor: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-800 dark:text-green-200",
      borderColor: "border-green-300 dark:border-green-700",
    },
  };
  return configs[status];
};

export default function OrderList() {
  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="border-gray-200 dark:border-gray-700 z-10">
        <h1 className="text-xl font-bold mb-3">รายการออเดอร์หมูกระทะ</h1>
      </div>
      <div className="space-y-3">
        {mockOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {order.date}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Order Items */}
                <div className="px-4 py-3">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ลูกค้า:
                    </span>
                    <span className="text-sm font-medium">
                      {order.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">ยอดรวม:</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      ฿{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
