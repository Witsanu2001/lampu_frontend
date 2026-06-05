/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 🌙 เปิดใช้งาน Dark Mode
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // 🌟 บรรทัดนี้สำคัญมาก! เป็นการบอกให้หาไฟล์โค้ดทั้งหมดในโฟลเดอร์ src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}