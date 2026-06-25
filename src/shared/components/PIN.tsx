import { Loading } from "./Loading";

interface PinTypeOneProps {
  pin: string;
  error: boolean;
  title?: string;
  onNumberPress: (num: string) => void;
  onDeletePress: () => void;
  onClose: () => void;
  loading?: boolean;
  loadingMessage?: string;
}

export function PinTypeOne({
  pin,
  error,
  title,
  onNumberPress,
  onDeletePress,
  onClose,
  loading = false,
  loadingMessage = "กำลังตรวจสอบ...",
}: PinTypeOneProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-blue-100/80 dark:bg-blue-400/20 w-full sm:max-w-md p-8 rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <h2 className="text-xl text-gray-800 dark:text-white font-bold text-center mb-6">
          {title}
        </h2>

        {loading && (
          <Loading message={loadingMessage} />
        )}
        
        <div
          className={`flex justify-center gap-4 mb-10 ${error ? "animate-bounce" : ""}`}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                pin.length > i
                  ? error
                    ? "bg-red-500 border-red-500"
                    : "bg-blue-500 border-blue-500"
                  : "border-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-[280px] mx-auto pb-4 sm:pb-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => onNumberPress(num.toString())}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-blue-100/80 dark:bg-blue-400/20 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-500 text-blue-800 dark:text-white text-2xl sm:text-3xl font-semibold rounded-full transition-colors flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16 sm:w-20 sm:h-20"></div>
          <button
            onClick={() => onNumberPress("0")}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-blue-100/80 dark:bg-blue-400/20 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-500 text-blue-800 dark:text-white text-2xl sm:text-3xl font-semibold rounded-full transition-colors flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={onDeletePress}
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

        <button
          onClick={onClose}
          className="w-full mt-6 text-gray-500 hover:text-gray-700"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
