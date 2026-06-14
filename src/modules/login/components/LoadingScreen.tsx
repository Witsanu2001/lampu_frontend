// src/shared/components/LoadingScreen.tsx
interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "กำลังเชื่อมต่อ..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}