# React Base

Base project React + TypeScript theo kiến trúc **feature-based** (tham khảo [bulletproof-react](https://github.com/alan2207/bulletproof-react)). Mỗi file một trách nhiệm, ngắn gọn, dễ bảo trì.

**Stack:** Vite 8 · React 19 · TypeScript · React Router 7 · Axios

## Chạy project

```bash
npm install
cp .env.example .env   # chỉnh VITE_API_URL theo backend của bạn
npm run dev            # http://localhost:3000
npm run build          # build production
```

## Cấu trúc thư mục

```
src/
├── app/          # App entry: App.tsx + AppProvider (gom mọi provider toàn cục)
├── routes/       # Khai báo route (lazy load) + PATHS (đường dẫn tập trung)
├── config/       # env.ts — đọc biến môi trường tại 1 nơi duy nhất
├── constants/    # Hằng số dùng chung (storage keys, http status…)
├── services/     # httpClient (API demo) · oplearnClient (axios + token + auto refresh)
│                 # BaseService (CRUD cha) · OplearnBaseService (CRUD cha, unwrap ResponseGeneral)
├── contexts/     # Context toàn cục (AuthContext…)
├── hooks/        # Hook dùng chung (useFetch, useDebounce, useLocalStorage)
├── utils/        # Hàm thuần dùng chung (storage, format, error)
├── components/
│   ├── ui/       # Component nhỏ tái sử dụng (Button, Input, Spinner)
│   ├── layout/   # Header, MainLayout
│   └── common/   # ErrorBoundary…
├── features/     # ⭐ Mỗi tính năng 1 thư mục, tự chứa mọi thứ của nó
│   └── users/
│       ├── types.ts          # Kiểu dữ liệu của feature
│       ├── user.service.ts   # Kế thừa BaseService
│       ├── hooks/            # Hook riêng của feature
│       ├── components/       # Component riêng của feature
│       └── pages/            # Trang của feature
├── pages/        # Trang chung không thuộc feature nào (404…)
└── styles/       # Style manifest (index.ts) — theo pattern của tu-vi-v1:
    ├── base/       # variables.css (token light/dark), reset, layout
    ├── utilities/  # buttons, cards, misc (spinner, pagination…)
    ├── components/ # nav, form, footer, home, poems
    └── theme/      # body-gradient + dark.css (import CUỐI cascade)
```

## Nguyên tắc

1. **Feature-based**: code của tính năng nào nằm gọn trong `features/<tên>` — xóa feature là xóa 1 thư mục, không vương vãi.
2. **Kế thừa service**: API mới chỉ cần `class XService extends BaseService<X> { constructor() { super('/x') } }` — có ngay đủ CRUD.
3. **Component không gọi API trực tiếp**: component → hook → service → httpClient. Đổi cách gọi API chỉ sửa 1 tầng.
4. **File ngắn, một trách nhiệm**: file chạm ~150 dòng là tín hiệu cần tách nhỏ.
5. **Không hardcode**: path dùng `PATHS`, env dùng `env`, key localStorage dùng `STORAGE_KEYS`.
6. **Import qua alias `@/`**: không dùng `../../..`.

## Thêm 1 feature mới (vd: products)

```bash
src/features/products/
├── types.ts           # interface Product { ... }
├── product.service.ts # class ProductService extends BaseService<Product>
├── hooks/useProducts.ts
├── components/ProductCard.tsx
└── pages/ProductsPage.tsx
```

Sau đó đăng ký route:

1. Thêm `PRODUCTS: '/products'` vào `src/routes/paths.ts`
2. Thêm lazy import + route con vào `src/routes/index.tsx`
3. (Tuỳ chọn) thêm link vào `NAV_ITEMS` trong `Header.tsx`

## Giao diện & theme

Design system theo template tu-vi-v1: token CSS `--c-*` cho cả light (ấm, kem) và dark
(navy) — đổi theme qua `data-theme` trên `<html>`. Nút toggle 🌙/☀️ trên header
(`useTheme` hook); inline script trong `index.html` set theme trước paint để không nháy.
Khi viết UI mới: dùng token `var(--c-*)`, KHÔNG hardcode màu — dark mode tự ăn theo;
màu nào buộc phải hardcode thì phủ lại trong `styles/theme/dark.css`.

## Đăng nhập (access token + refresh token)

- `features/auth`: LoginPage (`/login`), ProfilePage (`/profile`, cần đăng nhập), `auth.service.ts`.
- `services/oplearnClient.ts`: tự gắn `Authorization: Bearer <access_token>`; gặp 401 thì tự gọi
  `/auth/refresh` (nhiều request 401 cùng lúc chỉ refresh 1 lần) rồi retry; refresh fail → xoá phiên, về `/login`.
- `services/tokenStorage.ts`: nơi duy nhất đọc/ghi token trong localStorage.
- Bọc route cần đăng nhập bằng `<ProtectedRoute>` trong `routes/index.tsx`.

Service gọi backend oplearn chỉ cần kế thừa `OplearnBaseService` (đã unwrap `ResponseGeneral`):

```ts
class ProductService extends OplearnBaseService<Product> {
  constructor() { super('/products') }
}
```

## Feature mẫu

`features/users` gọi API thật từ [jsonplaceholder](https://jsonplaceholder.typicode.com) để bạn thấy full flow: **service kế thừa → hook → page** kèm search có debounce. Khi làm project thật, đổi `VITE_API_URL` và tạo feature của bạn theo đúng mẫu này.
