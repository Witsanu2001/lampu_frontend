import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - ปรับแต่งให้ responsive */}
      <div className="relative bg-white dark:bg-gray-800 w-full h-full md:h-auto md:w-full md:max-w-2xl md:max-h-[85vh] md:rounded-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            🛒 ตะกร้าสินค้า
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items - ปรับ padding */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">ตะกร้าว่างเปล่า</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <img src={item.image} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white truncate">{item.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">฿{item.price}</p>
                  </div>

                  <div className="flex items-center gap-1 md:gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg">-</button>
                    <span className="w-6 md:w-8 text-center font-semibold text-gray-800 dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg">+</button>
                  </div>

                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 space-y-4 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800 dark:text-white">รวมทั้งหมด</span>
              <span className="text-xl md:text-2xl font-bold text-emerald-500">฿{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={clearCart} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold">ล้างตะกร้า</button>
              <button 
                onClick={() => { onClose(); navigate("/payment"); }} 
                className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold"
              >
                ชำระเงิน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
