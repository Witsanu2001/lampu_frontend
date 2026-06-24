# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

# กรณี deploy ตัวจริง ให้ push ขึ้น github แล้วระบบ github actions จะทำการ deploy ให้อัตโนมัติ

#เปลี่ยน branch เป็น dev หรือ แตก branch ใหม่

#1. กลับไปตั้งหลักที่ main ก่อน (เผื่อคุณเผลอไปอยู่สาขาอื่น)
git checkout main

#2. ดึงโค้ดล่าสุดจาก GitHub ลงมาอัปเดตเครื่องเรา (ป้องกันโค้ดชนกัน)
git pull origin main

#3. แตก Branch ใหม่ชื่อ dev และย้ายตัวเองไปอยู่สาขานั้นทันที!
git checkout -b dev

#4. เอาสาขา dev ดันขึ้นไปเก็บไว้บน GitHub ด้วย
git push -u origin dev


#เปลี่ยนไปเป็น main 
git checkout main 
#หรือ ถ้าเป็น Git เวอร์ชันใหม่ๆ จะใช้คำสั่ง 
git switch main #ก็ได้ครับ ผลลัพธ์เหมือนกันเป๊ะ

#ถ้ามีงานที่เขียนค้างไว้ใน dev: ก่อนจะสลับกลับไป main แนะนำให้เคลียร์งานใน dev ให้เรียบร้อยก่อนครับ โดยการพิมพ์เซฟงานไว้:

git add .
git commit -m "save work on main v5.5"
git push origin

#อยากสลับกลับไปทำงานที่ dev อีกรอบทำยังไง

git checkout dev

สำหรับ deploy ขึ้น firebase
npm run build
firebase deploy --only hosting

firebase deploy --only hosting:frontend

เคลียข้อมูลที่ commit ไป > git reset origin/main


git fetch

git merge

git pull

git pull origin main

หรือถ้า branch หลักเป็น master

git pull origin master

git stash
git pull
git stash pop