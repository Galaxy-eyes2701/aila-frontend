# AILA Frontend

Giao diện web (SPA) của nền tảng học AI **AILA – Bình Dân Học AI**, xây dựng bằng React 19 + Vite, tiêu thụ REST API của backend `AILA.Api`.

---

## 1. Tổng quan

Ứng dụng phục vụ 4 nhóm người dùng: **Guest**, **Learner**, **Expert**, **Admin**. Toàn bộ giao diện dùng **tiếng Việt**.

| Nhóm | Chức năng chính |
|---|---|
| Public | Trang chủ, danh sách & chi tiết khóa học, blog, hồ sơ Expert công khai, bảng giá gói đăng ký |
| Auth | Modal đăng nhập / đăng ký, đăng nhập Google, quên mật khẩu 3 bước (Email → OTP → Mật khẩu mới), onboarding |
| Learner | Màn hình học, làm quiz & xem kết quả, luyện tập AI Practice, trợ lý chat AI (RAG), hồ sơ học tập, thanh toán gói đăng ký, báo cáo khóa học, nhờ chuyên gia đánh giá |
| Expert | Dashboard, quản lý khóa học / học phần / học liệu, import câu hỏi, chạy thử AI Practice, chấm bài đánh giá, thống kê tài nguyên AI |
| Admin | Quản lý người dùng, tag, danh mục, blog, báo cáo, gói đăng ký, giới hạn tài nguyên, nhật ký hoạt động |

---

## 2. Công nghệ sử dụng

| Hạng mục | Công nghệ | Version |
|---|---|---|
| Framework | React + react-dom | `^19.2.0` |
| Ngôn ngữ | JavaScript (JSX) — **không dùng TypeScript** | — |
| Build tool | Vite (bản beta) | `^8.0.0-beta.13` |
| Routing | react-router-dom (`createBrowserRouter`) | `^7.13.1` |
| HTTP client | axios | `^1.13.6` |
| State management | **React Context API** (không Redux/Zustand) | — |
| Styling | **CSS Modules** (66 file `*.module.css`) + `global.css` | — |
| Rich text editor | TipTap (`@tiptap/react` + starter-kit + 7 extension) | `^3.27.4` |
| Sanitize HTML | dompurify | `^3.4.12` |
| Icon / Font | Font Awesome 6.5.0 + Google Fonts (CDN trong `index.html`) | — |
| Linting | ESLint 9 (flat config) + react-hooks + react-refresh | `^9.39.1` |
| Testing | **Không cấu hình** | — |

> `@microsoft/signalr` và `jwt-decode` có trong `package.json` nhưng **không được import ở đâu trong `src/`**. Việc decode JWT được tự viết trong `src/services/token.js` và `GoogleCallback.jsx`.

---

## 3. Cấu trúc thư mục

```text
aila-frontend/
├── index.html                # HTML entry: title, Google Fonts, Font Awesome
├── vite.config.js            # Plugin React + 6 path alias
├── jsconfig.json             # Path alias cho IDE (phải khớp vite.config.js)
├── vercel.json               # SPA rewrite: mọi path → /index.html
├── .nvmrc                    # Node 20
└── src/
    ├── main.jsx              # createRoot + StrictMode + AuthProvider
    ├── App.jsx               # Render <AppRouter />
    ├── routing/              # AppRouter.jsx + 3 route guard (Learner/Expert/Admin)
    ├── services/             # 34 file: api.js (axios instance) + các module gọi API
    ├── state/                # context/AuthContext.jsx, hooks/useAuth, useModalA11y
    ├── infrastructure/       # constants/ + styles/global.css
    └── presentation/
        ├── layouts/          # MainLayout, ExpertLayout, AdminLayout
        ├── components/       # Header, Footer, Toast, Pagination, AuthModals...
        └── pages/            # Admin/, Expert/, Learner/, Courses/, Home/, BlogList/...
```

**Path alias** — khai báo ở **cả** `vite.config.js` và `jsconfig.json`:
`@` → `src/` · `@presentation` · `@routing` · `@state` · `@services` · `@infrastructure`

---

## 4. Yêu cầu môi trường

- **Node.js >= 20.18.0** (`package.json` → `engines`; `.nvmrc` ghi `20`)
- **npm** (repo dùng `package-lock.json`)
- Backend `AILA.Api` đang chạy và truy cập được
- Kết nối Internet (Google Fonts & Font Awesome load từ CDN)

---

## 5. Cài đặt & chạy

```bash
git clone https://github.com/Galaxy-eyes2701/aila-frontend.git
cd aila-frontend

nvm use          # dùng Node 20 theo .nvmrc (nếu có nvm)
npm install
npm run dev      # dev server tại http://localhost:5173
```

| Lệnh | Mô tả |
|---|---|
| `npm run dev` / `npm start` | Chạy Vite dev server |
| `npm run build` | Build production → thư mục `dist/` |
| `npm run preview` | Xem trước bản build |
| `npx eslint .` | Chạy lint (**không có script `lint`** trong `package.json`) |

---

## 6. Cấu hình môi trường

**Project không dùng environment variables** — không có file `.env` nào và không có chỗ nào dùng `import.meta.env` / `VITE_*`.

API base URL được **hard-code** trong `src/services/api.js`:

```js
const api = axios.create({
  //baseURL: "https://localhost:7124/api",
  baseURL: "https://api.aila.io.vn/api",
  withCredentials: true,
});
```

- ⚠️ **Muốn trỏ về backend local, phải sửa trực tiếp file này** (bỏ comment dòng `localhost:7124`).
- `withCredentials: true` là **bắt buộc** — backend trả refresh token qua cookie `HttpOnly`.
- Origin của frontend phải nằm trong CORS whitelist của backend (mặc định đã có `http://localhost:5173`).

Mọi tích hợp bên thứ ba (Google OAuth, Cloudinary, SePay) đều xử lý ở backend — **frontend không chứa API key hay secret nào**.

---

## 7. Routing

Toàn bộ route định nghĩa tại `src/routing/AppRouter.jsx`.

| Nhóm | Route tiêu biểu | Layout | Auth |
|---|---|---|---|
| Standalone | `/admin/login`, `/expert/login`, `/auth/google/callback`, `*` (404) | — | No |
| Public | `/`, `/courses`, `/courses/:id`, `/blogs`, `/experts/:expertId`, `/subscription-plans` | `MainLayout` | No |
| Learner | `/profile`, `/profile/subscription`, `/learning/:courseId`, `/courses/:courseId/materials/:materialId/quiz`, `.../practice`, `/notifications` | `MainLayout` | Learner |
| Expert | `/expert`, `/expert/courses`, `/expert/courses/:courseId/modules`, `/expert/evaluation-requests`, `/expert/simulation/:materialId` | `ExpertLayout` | Expert |
| Admin | `/admin/users`, `/admin/tags`, `/admin/reports`, `/admin/blogs`, `/admin/subscription-plans`, `/admin/ai-reports` | `AdminLayout` | Admin |

Route cần đăng nhập được bọc bởi `LearnerProtectedRoute` / `ExpertProtectedRoute` / `AdminProtectedRoute`. Với `/expert` và `/admin`, guard đặt ở cấp layout cha nên route con không cần bọc lại.

---

## 8. Authentication

Trạng thái đăng nhập lưu trong `localStorage` với 4 key: `accessToken`, `user`, `role`, `adminLoggedIn`.
Refresh token **không** lưu ở localStorage — backend set cookie `HttpOnly` tên `refreshToken`.

- **Login** — `AuthContext.login(accessToken, userData)` lưu token + user + role (chuẩn hóa qua `normalizeRole()`).
- **Google OAuth** — backend redirect về `/auth/google/callback` kèm `#accessToken=...`; `GoogleCallback.jsx` decode payload JWT, gọi `login()`, rồi xóa token khỏi URL.
- **Logout** — gọi `POST /auth/logout`, xóa 4 key và cookie `refreshToken`.
- **Auto-refresh** — response interceptor bắt lỗi **401**, gọi `POST /auth/refresh` rồi **replay request gốc**; thất bại thì xóa session.
- **Route guard** — kiểm tra `accessToken` + `role`; riêng Admin cần thêm `adminLoggedIn === 'true'`.

> Guard chỉ kiểm tra token **có tồn tại**, không kiểm tra hạn. Hàm `hasValidSession()` trong `src/services/token.js` dùng cho luồng nghiệp vụ cần chắc chắn phiên còn hiệu lực.

---

## 9. Gọi API

Tất cả request đi qua **một axios instance duy nhất** (`src/services/api.js`) — 29/34 file trong `src/services/` import instance này.

- **Request interceptor** — tự gắn `Authorization: Bearer <token>`. Truyền `{ skipAuth: true }` cho endpoint public (không gắn token, đồng thời loại khỏi cơ chế auto-refresh).
- **`resolveApiError(err)`** — trả `{ status, errorCode, errorMessage }`, tự **dịch thông báo lỗi của FluentValidation sang tiếng Việt**.
- **`normalizeApiResponse(payload)`** — đọc envelope của backend, chấp nhận cả camelCase lẫn PascalCase.

```js
import api from '@services/api';

/** GET /api/courses/{id} */
export async function getCourse(id) {
  const res = await api.get(`/courses/${id}`);
  return res.data;
}
```

> Quy ước: **rẽ nhánh theo `errorCode`, không parse `errorMessage`** (xem bảng mã `RESET_ERROR` và class `ApiError` trong `authApi.js`).

---

## 10. State, UI & Form

- **State** — chỉ `AuthContext` là global; dữ liệu server fetch trong `useEffect` và giữ ở local state của từng page (không có caching layer). Logic lặp lại tách thành custom hook cạnh feature (`useCountdown`, `useClientPagination`, `useAllRecords`).
- **UI** — không dùng UI library, toàn bộ component tự viết với CSS Modules. Component dùng chung: `Header`, `Footer`, `Toast` (success/error/info), `Pagination`, `ConfirmModal`, `AuthModals`.
- **Accessibility** — modal dùng hook `useModalA11y` (focus trap, đóng bằng Esc, trả focus, khóa scroll nền).
- **Bảo mật XSS** — mọi HTML từ backend đều sanitize bằng **DOMPurify** trước khi `dangerouslySetInnerHTML`.
- **Form** — không dùng thư viện form; controlled component + validation viết tay (mẫu đầy đủ: `pages/Admin/SubscriptionPlanManagement/planValidation.js`). Backend fail-fast nên **frontend cần validate đủ và hiện mọi lỗi cùng lúc**.

---

## 11. Testing

```
Testing framework: Not configured
```

Không có script `test`, không có Jest/Vitest/Playwright/Cypress, không có file `*.test.*` hay `*.spec.*`. Công cụ kiểm tra chất lượng code duy nhất là **ESLint**: `npx eslint .`

---

## 12. Build & Deployment

```bash
npm ci
npm run build      # → dist/
npm run preview
```

Repo có sẵn `vercel.json` cấu hình **SPA rewrite** (bắt buộc vì app dùng History API):

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Hosting khác: serve tĩnh thư mục `dist/` kèm rewrite về `index.html` (Nginx: `try_files $uri $uri/ /index.html;`).

> Repo **không có** Dockerfile và CI/CD workflow. Vì base URL API hard-code trong source, mỗi môi trường phải sửa `api.js` rồi build lại.

---

## 13. Lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| Request vẫn trỏ về `api.aila.io.vn` dù đang chạy backend local | Sửa `baseURL` trong `src/services/api.js` |
| Lỗi CORS | Thêm origin của frontend vào CORS policy của backend |
| Đăng nhập được nhưng reload là mất phiên | Cookie `refreshToken` là `HttpOnly; SameSite=None; Secure` → backend phải chạy HTTPS, giữ `withCredentials: true` |
| Backend local dùng self-signed cert bị chặn | Chạy `dotnet dev-certs https --trust`, hoặc mở `https://localhost:7124/swagger` chấp nhận cert |
| Truy cập thẳng `/admin/users` bị 404 sau deploy | Hosting thiếu SPA rewrite |
| Đăng nhập Admin xong vẫn bị đá về `/` | `AdminProtectedRoute` cần đủ 3 điều kiện: `accessToken`, `adminLoggedIn === 'true'`, `role === 'Admin'` |
| Icon thành ô vuông, font sai | Font Awesome / Google Fonts load từ CDN → kiểm tra mạng, ad-blocker |
| Import `@presentation/...` không resolve | Alias phải khai báo ở **cả** `vite.config.js` và `jsconfig.json` |
| Effect chạy 2 lần khi dev | `<StrictMode>` cố ý double-invoke ở dev → viết effect idempotent, có cleanup |

---

## 14. Quy ước phát triển

- **Tạo page:** thư mục `src/presentation/pages/<Nhóm>/<TenPage>/` gồm `TenPage.jsx` + `TenPage.module.css`; component/hook riêng đặt trong `components/` và `hooks/` con.
- **Tạo component dùng chung:** đặt tại `src/presentation/components/<Ten>/`. Nếu là modal thì dùng `useModalA11y`; render HTML từ backend thì **bắt buộc sanitize bằng DOMPurify**.
- **Tạo API service:** file `src/services/<domain>Api.js`, luôn `import api from '@services/api'` (không tạo instance axios mới), đường dẫn viết tương đối vì `baseURL` đã có `/api`.
- **Thêm route:** import page vào `AppRouter.jsx`, đặt vào đúng nhánh layout, bọc guard nếu cần đăng nhập.
- **Auth trong component:** dùng `useAuth()` thay vì đọc thẳng `localStorage`; so sánh role qua `normalizeRole()`; không tự gắn header `Authorization` hay tự xử lý 401 (interceptor đã lo).
- Trước khi commit: chạy `npx eslint .`.
