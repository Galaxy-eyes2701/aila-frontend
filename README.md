# AILA Frontend

Giao diện web của nền tảng học AI **AILA – Bình Dân Học AI**, xây dựng bằng React và Vite, hoạt động như một ứng dụng một trang (SPA) và lấy dữ liệu từ backend `AILA.Api`.

---

## 1. Tổng quan

Ứng dụng phục vụ bốn nhóm người dùng: **khách vãng lai**, **người học**, **chuyên gia** và **quản trị viên**. Toàn bộ giao diện và thông báo hiển thị bằng tiếng Việt.

| Nhóm | Nội dung sử dụng được |
|---|---|
| Khách | Trang chủ, danh sách và chi tiết khóa học, bài viết blog, hồ sơ chuyên gia, bảng giá gói đăng ký |
| Đăng nhập | Cửa sổ đăng nhập và đăng ký, đăng nhập bằng Google, quên mật khẩu qua ba bước, khảo sát ban đầu sau khi đăng ký |
| Người học | Màn hình học tập, làm bài trắc nghiệm và xem kết quả, luyện tập với AI, trợ lý hỏi đáp trong khóa học, hồ sơ học tập, mua và theo dõi gói đăng ký, báo cáo khóa học, gửi bài nhờ chuyên gia đánh giá |
| Chuyên gia | Trang tổng quan, quản lý khóa học, học phần và học liệu, nhập câu hỏi từ file, chạy thử bài luyện tập AI, chấm bài đánh giá, xem thống kê tài nguyên AI đã dùng |
| Quản trị viên | Quản lý người dùng, thẻ, danh mục, bài viết, báo cáo vi phạm, gói đăng ký, hạn mức tài nguyên và nhật ký hoạt động |

---

## 2. Công nghệ sử dụng

| Hạng mục | Công nghệ |
|---|---|
| Thư viện giao diện | React 19 |
| Ngôn ngữ | JavaScript (JSX)|
| Công cụ build | Vite |
| Điều hướng | React Router |
| Gọi API | Axios |
| Quản lý trạng thái | React Context, không dùng thư viện ngoài |
| Giao diện | CSS Modules, không dùng thư viện UI dựng sẵn |
| Soạn thảo nội dung | TipTap |
| Làm sạch HTML | DOMPurify |
| Biểu tượng và phông chữ | Font Awesome và Google Fonts tải qua CDN |
| Kiểm tra mã nguồn | ESLint |

---

## 3. Cấu trúc dự án

```text
aila-frontend/
├── index.html            # Trang gốc, khai báo tiêu đề, phông chữ và biểu tượng
├── vite.config.js        # Cấu hình build và các đường dẫn rút gọn
├── jsconfig.json         # Đường dẫn rút gọn dành cho trình soạn thảo
├── vercel.json           # Cấu hình điều hướng khi triển khai lên Vercel
├── .nvmrc                # Phiên bản Node khuyến nghị
└── src/
    ├── main.jsx          # Điểm khởi động ứng dụng
    ├── App.jsx           # Gắn bộ định tuyến
    ├── routing/          # Khai báo toàn bộ đường dẫn và các lớp kiểm tra quyền truy cập
    ├── services/         # Tầng gọi API, gồm cấu hình chung và các module theo nghiệp vụ
    ├── state/            # Trạng thái đăng nhập dùng chung và các hook tiện ích
    ├── infrastructure/   # Hằng số dùng chung và style toàn cục
    └── presentation/
        ├── layouts/      # Bố cục riêng cho khách, chuyên gia và quản trị viên
        ├── components/   # Thành phần dùng chung như header, footer, thông báo, phân trang
        └── pages/        # Các trang, chia theo vai trò người dùng
```

Mã nguồn dùng các đường dẫn rút gọn như `@services` hay `@presentation`; những đường dẫn này phải được khai báo đồng thời ở `vite.config.js` và `jsconfig.json`.

---

## 4. Yêu cầu môi trường

- Node.js phiên bản 20.18.0 trở lên
- npm
- Backend `AILA.Api` đang chạy và truy cập được
- Kết nối Internet, do phông chữ và biểu tượng được tải từ CDN

---

## 5. Cài đặt và chạy

```bash
git clone https://github.com/Galaxy-eyes2701/aila-frontend.git
cd aila-frontend

nvm use          # dùng đúng phiên bản Node ghi trong .nvmrc
npm install
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173`.

| Lệnh | Mục đích |
|---|---|
| `npm run dev` hoặc `npm start` | Chạy ở chế độ phát triển |
| `npm run build` | Đóng gói bản chạy thật vào thư mục `dist` |
| `npm run preview` | Xem thử bản đã đóng gói |
| `npx eslint .` | Kiểm tra mã nguồn (chưa có lệnh tắt trong `package.json`) |

---

## 6. Cấu hình

Dự án hiện **không dùng biến môi trường**, không có file `.env` nào. Địa chỉ backend được ghi cố định trong `src/services/api.js` và đang trỏ tới máy chủ chính thức; muốn chuyển sang backend chạy trên máy cá nhân thì phải sửa trực tiếp trong file này.

Ứng dụng gửi kèm cookie khi gọi API để duy trì phiên đăng nhập, vì vậy tên miền của frontend phải nằm trong danh sách được backend cho phép.

Mọi tích hợp bên thứ ba như Google, Cloudinary hay cổng thanh toán đều do backend xử lý, nên **mã nguồn frontend không chứa khóa bí mật nào**.

---

## 7. Đường dẫn trong ứng dụng

Toàn bộ đường dẫn khai báo tập trung tại `src/routing/AppRouter.jsx` và chia thành bốn nhóm:

- **Trang độc lập** — đăng nhập cho chuyên gia và quản trị viên, trang nhận kết quả đăng nhập Google, trang báo không tìm thấy nội dung.
- **Trang công khai và người học** — trang chủ, khóa học, blog, hồ sơ chuyên gia, gói đăng ký, cùng các trang học tập và hồ sơ cá nhân dành riêng cho người đã đăng nhập.
- **Khu vực chuyên gia** — các trang quản lý khóa học, học liệu, chấm bài và thống kê.
- **Khu vực quản trị** — các trang quản lý người dùng, nội dung, báo cáo và cấu hình hệ thống.

Những trang yêu cầu đăng nhập được bảo vệ bằng lớp kiểm tra quyền tương ứng với từng vai trò.

---

## 8. Đăng nhập và phiên làm việc

Thông tin đăng nhập được lưu trên trình duyệt, còn phần dùng để gia hạn phiên do backend giữ trong cookie an toàn. Khi phiên hết hạn, ứng dụng tự động xin cấp lại và thực hiện lại yêu cầu đang dở; nếu không gia hạn được thì xóa phiên và đưa người dùng về trang chủ. Đăng xuất sẽ xóa toàn bộ thông tin phiên ở cả trình duyệt lẫn máy chủ.

Giao diện hiển thị khác nhau theo vai trò, mỗi vai trò dùng một bố cục và thanh điều hướng riêng.

---

## 9. Kết nối với backend

Toàn bộ lời gọi API đi qua một cấu hình dùng chung trong `src/services/api.js`, nơi đảm nhiệm việc gắn thông tin đăng nhập, gia hạn phiên và chuẩn hóa thông báo lỗi. Các thông báo lỗi kỹ thuật do backend trả về được chuyển thành câu tiếng Việt dễ hiểu trước khi hiển thị.

Mỗi nghiệp vụ có một module riêng trong thư mục `services`, đặt tên theo lĩnh vực như khóa học, trắc nghiệm, luyện tập, thanh toán hay quản trị.

---

## 10. Giao diện và biểu mẫu

Toàn bộ thành phần giao diện đều tự xây dựng, không dùng thư viện UI dựng sẵn, và được tạo kiểu bằng CSS Modules để tránh xung đột style. Các hộp thoại có hỗ trợ điều hướng bằng bàn phím và đóng bằng phím Esc. Nội dung HTML nhận từ backend luôn được làm sạch trước khi hiển thị.

Biểu mẫu được viết thủ công, không dùng thư viện quản lý form. Do backend chỉ báo lỗi đầu tiên gặp phải, phía giao diện tự kiểm tra đầy đủ và hiển thị mọi lỗi cùng lúc để người dùng sửa một lần.

---

## 11. Kiểm thử

Dự án **chưa cấu hình bất kỳ framework kiểm thử nào** — không có lệnh chạy test và không có file test trong mã nguồn. Công cụ kiểm tra chất lượng duy nhất hiện có là ESLint:

```bash
npx eslint .
```

---

## 12. Đóng gói và triển khai

```bash
npm ci
npm run build
```

Kết quả nằm trong thư mục `dist` và có thể đưa lên bất kỳ dịch vụ lưu trữ tĩnh nào. Do ứng dụng là SPA, máy chủ phải được cấu hình để mọi đường dẫn đều trả về trang gốc; repository đã có sẵn cấu hình này cho Vercel. Dự án chưa có Dockerfile và chưa có pipeline CI/CD.

---
