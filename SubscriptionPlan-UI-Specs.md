# Đặc tả UI — Subscription Plan Management (AILA)

**Phạm vi:** UI cho UC-09, UC-90, UC-91, UC-92.
**Nguồn chân lý:** API đã triển khai trong `aila-backend` (không phải bản `SubscriptionPlan-Specs.md`). Chỗ nào API lệch so với spec nghiệp vụ đều được đánh dấu ⚠️ trong tài liệu này.
**Đối tượng đọc:** dev FE. Tài liệu không chỉ định framework; mọi thứ dưới đây là contract, state và hành vi.

---

## 0. Nền chung

### 0.1 Envelope

Mọi endpoint trả về cùng một vỏ, JSON camelCase:

```jsonc
// thành công
{ "success": true,  "data": <T>, "errorCode": null, "errorMessage": null }

// thất bại
{ "success": false, "data": null, "errorCode": "PLAN_NOT_FOUND", "errorMessage": "Không tìm thấy gói đăng ký." }
```

**Quy tắc:** luôn đọc `success` để phân nhánh, đừng chỉ dựa vào HTTP status. `errorMessage` là tiếng Việt, đã viết cho người dùng cuối — hiển thị trực tiếp, không tự chế lại. `errorCode` dùng để **quyết định hiển thị ở đâu** (ô nào, toast hay banner), không dùng để dịch lại nội dung.

### 0.2 Backend fail-fast — hệ quả quan trọng cho FE

Backend **chỉ trả về lỗi validation ĐẦU TIÊN** gặp phải, không trả danh sách lỗi. Nếu FE chỉ dựa vào server để validate, admin sẽ phải sửa từng lỗi một qua nhiều lần submit.

→ **FE bắt buộc validate client-side đầy đủ trước khi submit** và hiển thị mọi lỗi cùng lúc. Server-side validation là lưới an toàn, không phải nguồn lỗi chính. Rule client phải khớp 1-1 với §0.4.

### 0.3 Kiểu dữ liệu

| Trường | Kiểu JSON | Ghi chú |
|---|---|---|
| `id`, `planId` | string (UUID) | |
| `price` | number | decimal(18,2) — tối đa 2 chữ số thập phân |
| `tierLevel`, `durationInDays`, `displayOrder`, `*Limit` | number | **số nguyên 32-bit**, max `2147483647` |
| `status` | string | `"Active"` \| `"Inactive"` |
| `createdAt`, `updatedAt` | string (ISO 8601, UTC) | `updatedAt` có thể `null` |
| `description` | string \| null | |

⚠️ Vượt ngưỡng int32 sẽ bị model binding của ASP.NET chặn và trả về lỗi **không theo envelope** (`ValidationProblemDetails` chuẩn của .NET). FE phải chặn ở client bằng `max` để không bao giờ chạm case này.

### 0.4 Rule validation (client mirror của server)

| Trường | Rule | Thông báo khi vi phạm |
|---|---|---|
| Name | bắt buộc, sau `trim` không rỗng, ≤ 100 ký tự | "Tên gói đăng ký không được để trống." / "Tên gói đăng ký không được vượt quá 100 ký tự." |
| Description | tùy chọn, sau `trim` ≤ 1000 ký tự | "Mô tả gói không được vượt quá 1000 ký tự." |
| Price | > 0, tối đa 2 chữ số thập phân | "Giá gói phải lớn hơn 0." |
| TierLevel | số nguyên > 0 | "Cấp độ gói phải lớn hơn 0." |
| DurationInDays | số nguyên > 0 | "Thời hạn gói phải lớn hơn 0 ngày." |
| AiTokenLimit | số nguyên ≥ 0 | "Giới hạn AI Token không hợp lệ." |
| AiPracticeScenarioLimit | số nguyên ≥ 0 | "Giới hạn số lần AI Practice không hợp lệ." |
| ExpertEvaluationLimit | số nguyên ≥ 0 | "Giới hạn số lần đánh giá chuyên gia không hợp lệ." |
| DisplayOrder | số nguyên ≥ 0 | "Thứ tự hiển thị không hợp lệ." |

**`0` là giá trị hợp lệ cho cả ba `*Limit` và `DisplayOrder`** — đừng cấm nhầm. Chỉ `Price`, `TierLevel`, `DurationInDays` mới yêu cầu `> 0`.

### 0.5 Định dạng hiển thị

- **Giá:** `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`. ⚠️ Hệ thống chưa có trường currency ở đâu cả — VND là suy luận từ ngữ cảnh, **cần BA xác nhận** trước khi hard-code.
- **Thời hạn:** `"{durationInDays} ngày"`. Nếu muốn thân thiện hơn (30 → "1 tháng") thì phải chốt quy tắc với BA, đừng tự làm tròn.
- **Ngày:** `dd/MM/yyyy HH:mm`, đổi từ UTC sang giờ local.
- **`description === null`:** không render phần tử mô tả, tuyệt đối không in ra chuỗi `"null"` hay `"-"`.

### 0.6 Bảng mã lỗi

| errorCode | HTTP | Nơi hiển thị | Gắn vào field |
|---|---|---|---|
| `PLAN_NAME_REQUIRED` | 400 | inline | Name |
| `PLAN_NAME_TOO_LONG` | 400 | inline | Name |
| `PLAN_DESCRIPTION_TOO_LONG` | 400 | inline | Description |
| `INVALID_PLAN_PRICE` | 400 | inline | Price |
| `INVALID_TIER_LEVEL` | 400 | inline | TierLevel |
| `INVALID_PLAN_DURATION` | 400 | inline | DurationInDays |
| `INVALID_AI_TOKEN_LIMIT` | 400 | inline | AiTokenLimit |
| `INVALID_AI_PRACTICE_SCENARIO_LIMIT` | 400 | inline | AiPracticeScenarioLimit |
| `INVALID_EXPERT_EVALUATION_LIMIT` | 400 | inline | ExpertEvaluationLimit |
| `INVALID_DISPLAY_ORDER` | 400 | inline | DisplayOrder |
| `PLAN_NAME_ALREADY_EXISTS` | 409 | inline | Name |
| `TIER_LEVEL_ALREADY_EXISTS` | 409 | inline | TierLevel |
| `PLAN_NOT_FOUND` | 404 | toast + đóng modal + refetch | — |
| `PLAN_NOT_AVAILABLE` | 404 | toast (chỉ endpoint công khai) | — |
| `PLAN_ALREADY_ACTIVE` | 409 | toast + refetch | — |
| `PLAN_ALREADY_INACTIVE` | 409 | toast + refetch | — |
| `VALIDATION_ERROR` | 400 | banner ở đầu form | — |

Ngoài envelope: **401** (chưa đăng nhập) → đẩy về trang login; **403** (không phải Admin) → trang "Không có quyền truy cập"; **5xx / network** → banner lỗi kèm nút *Thử lại*, không phá state form.

---

## 1. API contract

### 1.1 `GET /api/subscription-plans` — công khai

Không cần token. Luôn `success: true`; danh sách rỗng **không** phải lỗi.

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "3f2c…",
      "name": "Premium",
      "description": "Gói đầy đủ tính năng",   // có thể null
      "price": 499000,
      "durationInDays": 30,
      "aiTokenLimit": 1000000,
      "aiPracticeScenarioLimit": 50,
      "expertEvaluationLimit": 5
    }
  ]
}
```

Đã lọc `Active` và **đã sắp xếp sẵn** (`displayOrder` → `tierLevel` → `createdAt`). **FE không được sort lại** — thứ tự do BE quyết định để ổn định giữa các lần tải.

Payload cố ý **không có** `status`, `tierLevel`, `displayOrder`. Đừng yêu cầu BE thêm vào: đó là ràng buộc bảo mật (không rò dữ liệu quản trị ra endpoint công khai).

### 1.2 `GET /api/subscription-plans/{planId}` — công khai, dùng để re-check trước khi mua

Trả về đúng shape như một phần tử ở §1.1.

- `200` → gói còn bán, được phép sang trang mua.
- `404` `PLAN_NOT_FOUND` → gói không tồn tại.
- `404` `PLAN_NOT_AVAILABLE` → gói tồn tại nhưng đã ngừng bán.

Với người dùng, **hai case 404 hiển thị như nhau**: "Gói đăng ký này hiện không còn được bán." Không phân biệt để tránh lộ sự tồn tại của gói Inactive.

### 1.3 `GET /api/admin/subscription-plans` — Admin

Gồm cả gói Inactive, sắp xếp như §1.1.

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "3f2c…",
      "name": "Premium",
      "description": null,
      "price": 499000,
      "tierLevel": 3,
      "durationInDays": 30,
      "aiTokenLimit": 1000000,
      "aiPracticeScenarioLimit": 50,
      "expertEvaluationLimit": 5,
      "displayOrder": 2,
      "status": "Active",
      "createdAt": "2026-07-27T04:11:02.331Z",
      "updatedAt": null
    }
  ]
}
```

### 1.4 `POST /api/admin/subscription-plans` — Admin, UC-90

```jsonc
// request
{
  "name": "Premium",
  "description": "Gói đầy đủ tính năng",   // nullable
  "price": 499000,
  "tierLevel": 3,
  "durationInDays": 30,
  "aiTokenLimit": 1000000,
  "aiPracticeScenarioLimit": 50,
  "expertEvaluationLimit": 5,
  "displayOrder": 2
}
```

**Không có trường `status`** — gói mới luôn được tạo ở trạng thái `Active`. Đừng thêm toggle trạng thái vào form tạo.

Thành công trả **`200`** kèm `AdminSubscriptionPlanDto` (⚠️ không phải `201`, không có header `Location`).

Lỗi: mọi mã ở §0.6 nhóm inline, cộng `409` cho hai mã trùng lặp.

### 1.5 `PUT /api/admin/subscription-plans/{planId}` — Admin, UC-91

```jsonc
// request — CHỈ 6 trường này
{
  "description": "Mô tả mới",
  "price": 599000,
  "aiTokenLimit": 2000000,
  "aiPracticeScenarioLimit": 100,
  "expertEvaluationLimit": 10,
  "displayOrder": 1
}
```

**Không gửi `name`, `tierLevel`, `durationInDays`** — cả ba đều bị BE bỏ qua hoàn toàn (xem §5.1). Gửi kèm không gây lỗi, chỉ vô nghĩa.

Thành công `200` + entity sau cập nhật. `404` `PLAN_NOT_FOUND` nếu gói đã bị xóa.

### 1.6 `PATCH /api/admin/subscription-plans/{planId}/status` — Admin, UC-92

```jsonc
{ "isActive": true }   // true → mở bán, false → ngừng bán
```

- `200` → entity sau đổi trạng thái.
- `404` `PLAN_NOT_FOUND`.
- `409` `PLAN_ALREADY_ACTIVE` / `PLAN_ALREADY_INACTIVE` → gói đã ở sẵn trạng thái đích. **Nghĩa là UI đang giữ dữ liệu cũ** (admin khác vừa đổi) → hiển thị toast rồi refetch danh sách, không coi là lỗi của người dùng.

---

## 2. Màn hình S1 — Trang gói đăng ký (công khai, UC-09)

**Route đề xuất:** `/subscription-plans`. Truy cập được khi **chưa đăng nhập**.

### 2.1 States

| State | Điều kiện | Hiển thị |
|---|---|---|
| Loading | đang gọi §1.1 | 3 skeleton card |
| Empty | `success && data.length === 0` | Empty state: "Hiện chưa có gói đăng ký nào." **Không render card nào.** |
| Loaded | `data.length > 0` | Lưới card theo đúng thứ tự API trả |
| Error | 5xx / network | Banner + nút *Thử lại* |

### 2.2 Card gói

Mỗi card gồm: tên gói, giá (đã format), thời hạn, mô tả (ẩn nếu null), và **ba dòng quyền lợi**:

- AI Token: `{aiTokenLimit}` — quy ước hiển thị khi `= 0`: **"Không bao gồm"** (đề xuất; cần BA chốt, vì `0` là giá trị hợp lệ và khác hẳn với "không giới hạn")
- Lượt AI Practice: `{aiPracticeScenarioLimit}`
- Lượt đánh giá chuyên gia: `{expertEvaluationLimit}`

Trang này **read-only tuyệt đối**: không render bất kỳ nút/ô/menu nào cho phép sửa dữ liệu gói, kể cả khi người đang xem là Admin.

### 2.3 Nút *Buy Now* — luồng bắt buộc

```
Bấm "Buy Now"
  │
  ├─ Chưa đăng nhập (không có token, hoặc token đã hết hạn)
  │     → Mở sign-in pop-up. KHÔNG điều hướng sang trang mua.
  │     → Đăng nhập thất bại / người dùng đóng pop-up
  │           → Ở NGUYÊN trang gói, giữ nguyên scroll position. Không điều hướng.
  │     → Đăng nhập thành công
  │           → chạy tiếp nhánh dưới
  │
  └─ Đã đăng nhập
        → Gọi GET /api/subscription-plans/{id}   ← BẮT BUỘC, không được bỏ
             ├─ 200 → điều hướng sang trang mua
             └─ 404 → toast "Gói đăng ký này hiện không còn được bán."
                       + refetch danh sách để card biến mất
```

**Vì sao bắt buộc bước re-check:** admin có thể ngừng bán gói trong lúc guest đang mở trang. Dữ liệu đã render **không đáng tin** tại thời điểm bấm mua. Bỏ bước này là lỗi nghiệp vụ, không phải tối ưu.

Kiểm tra token hết hạn phải làm **trước** khi coi người dùng là đã đăng nhập — token hết hạn đúng lúc bấm nút được xử lý y như chưa đăng nhập.

### 2.4 Ghi chú hiệu năng

BE **không có cache** cho endpoint này (xem §5.2). Nếu FE tự cache danh sách (SWR/React Query…), phải invalidate sau mọi thao tác mua thành công, và **không được cache kết quả của §1.2** — đó chính là bước re-check.

---

## 3. Màn hình S2 — Quản trị gói đăng ký (Admin)

**Route đề xuất:** `/admin/subscription-plans`. Guard: chỉ role `Admin`; role khác → trang 403.

### 3.1 Bảng

Cột: `displayOrder` · `tierLevel` · Tên · Giá · Thời hạn · AI Token · AI Practice · Đánh giá CG · Trạng thái · Cập nhật lúc · Thao tác.

- **Badge trạng thái:** `Active` → xanh "Đang bán"; `Inactive` → xám "Ngừng bán".
- Giữ nguyên thứ tự API trả về, không sort lại ở client.
- Empty state: "Chưa có gói đăng ký nào." + nút *Tạo gói*.
- Thao tác mỗi dòng: **Sửa** (mở S4) · **Ngừng bán** / **Mở bán** (mở S5, nhãn theo trạng thái hiện tại).

### 3.2 Quy tắc làm mới

Sau **mọi** mutation thành công (tạo / cập nhật / đổi trạng thái): đóng modal → hiện toast xác nhận → **refetch danh sách**. Không optimistic-update: một số lỗi (trùng khóa do race, 409 trạng thái) chỉ lộ ra sau khi server trả lời, optimistic sẽ hiển thị sai rồi phải rollback.

---

## 4. Modal S3 — Tạo gói (UC-90)

### 4.1 Form

| Nhóm | Trường | Control |
|---|---|---|
| Định danh | Name * | text, maxlength 100 |
| | Description | textarea, maxlength 1000 |
| Thương mại | Price * | number, min 0.01, step 0.01 |
| | TierLevel * | number, min 1, step 1 |
| | DurationInDays * | number, min 1, step 1 |
| Quyền lợi | AiTokenLimit * | number, min 0, step 1 |
| | AiPracticeScenarioLimit * | number, min 0, step 1 |
| | ExpertEvaluationLimit * | number, min 0, step 1 |
| Hiển thị | DisplayOrder * | number, min 0, step 1 |

Tất cả `number` đặt `max="2147483647"` (xem §0.3). **Không có control nào cho `Status`.**

### 4.2 Hành vi

1. Submit → validate client theo §0.4, hiện **toàn bộ** lỗi cùng lúc, chưa gọi API nếu có lỗi.
2. Hợp lệ → disable nút submit, gọi §1.4.
3. `success` → đóng modal, toast "Đã tạo gói đăng ký.", refetch.
4. `409` trùng tên/tier → **giữ modal mở, giữ nguyên dữ liệu đã nhập**, gắn lỗi vào đúng ô Name hoặc TierLevel, focus vào ô đó. Admin sửa và submit lại.
5. `400` → gắn lỗi vào field theo §0.6; `VALIDATION_ERROR` → banner đầu form.
6. Thất bại ở bất kỳ bước nào → **không có gói nào được tạo**, không thêm dòng nào vào bảng.

Trim `name` và `description` trước khi gửi — server cũng trim, nhưng client trim giúp việc đếm ký tự và so trùng nhất quán với những gì admin nhìn thấy.

---

## 5. Modal S4 — Cập nhật gói (UC-91)

### 5.1 ⚠️ Ba trường KHÔNG sửa được

| Trường | Lý do | Cách render |
|---|---|---|
| `name` | Bất biến theo thiết kế (giữ định danh gói ổn định) | Hiển thị dạng text tĩnh hoặc input `disabled` |
| `tierLevel` | Bất biến theo thiết kế (giữ thứ bậc nâng/hạ cấp) | Hiển thị dạng text tĩnh hoặc input `disabled` |
| `durationInDays` | **Giới hạn hiện tại của backend**, không phải chủ ý nghiệp vụ | Hiển thị dạng text tĩnh + tooltip |

**Về `durationInDays`:** spec nghiệp vụ (AC-91.1, AC-91.4) nói trường này sửa được, nhưng phương thức `Update()` ở tầng domain không nhận nó và domain hiện đang bị khóa không cho sửa. FE **không được** render nó thành ô nhập rồi gửi lên — giá trị sẽ bị bỏ qua âm thầm và admin tưởng đã lưu.

Nếu BA yêu cầu sửa được, đó là thay đổi phía backend (thêm tham số vào `Update()`), không phải việc FE khắc phục.

Với `name` và `tierLevel`, khuyến nghị đặt dòng chú thích trong modal: *"Tên gói và cấp độ không thể thay đổi sau khi tạo."*

### 5.2 Form sửa được

Đúng 6 trường: `description`, `price`, `aiTokenLimit`, `aiPracticeScenarioLimit`, `expertEvaluationLimit`, `displayOrder`. Control và rule y hệt §4.1.

### 5.3 Hành vi

1. Mở modal → prefill từ dữ liệu dòng đang có.
2. Submit không đổi gì cũng **hợp lệ** — vẫn gọi API, `updatedAt` sẽ được cập nhật.
3. `success` → đóng modal, toast "Đã cập nhật gói đăng ký.", refetch.
4. `404 PLAN_NOT_FOUND` (admin khác vừa xóa) → đóng modal, toast "Gói đăng ký không còn tồn tại.", refetch để admin quay về danh sách.
5. `400` → gắn lỗi vào field, **giữ modal mở**, không lưu thay đổi nào.

### 5.4 Cảnh báo về snapshot — nên hiển thị

Đặt ghi chú trong modal: *"Thay đổi chỉ áp dụng cho các lượt mua và gia hạn sau này. Các gói đăng ký đã bán vẫn giữ nguyên cấu hình tại thời điểm mua."*

Đây không phải trang trí — nó ngăn admin hiểu lầm rằng giảm quota sẽ cắt quyền lợi của người đã mua.

---

## 6. Dialog S5 — Đổi trạng thái (UC-92)

### 6.1 Bắt buộc xác nhận

Bấm *Ngừng bán* / *Mở bán* **không được gọi API ngay**. Phải mở dialog xác nhận trước; huỷ dialog → trạng thái không đổi, không có request nào được gửi.

### 6.2 Nội dung dialog

**Ngừng bán:**
> Ngừng bán gói **{name}**?
>
> Gói sẽ không còn hiển thị trên trang gói đăng ký công khai. Các gói đăng ký đã bán **không bị ảnh hưởng** và vẫn hoạt động bình thường.
>
> `[Huỷ]` `[Ngừng bán]`

**Mở bán:**
> Mở bán lại gói **{name}**?
>
> Gói sẽ trở lại trang công khai với **cấu hình hiện tại** (giá {price}, thời hạn {durationInDays} ngày). Nếu cần đổi giá hoặc quyền lợi, hãy cập nhật gói trước.
>
> `[Huỷ]` `[Mở bán]`

Câu nhắc "cấu hình hiện tại" là có chủ đích: gói bị ngừng bán lâu ngày rất dễ có giá lỗi thời.

### 6.3 Hành vi

1. Xác nhận → **disable cả hai nút**, hiện spinner. Đây là lớp chặn double-click; gửi lặp lần hai sẽ nhận `409`.
2. `success` → đóng dialog, toast ("Đã ngừng bán gói." / "Đã mở bán gói."), refetch.
3. `409 PLAN_ALREADY_ACTIVE` / `PLAN_ALREADY_INACTIVE` → đóng dialog, toast "Trạng thái gói vừa được thay đổi bởi người khác. Danh sách đã được làm mới.", refetch. **Không hiển thị như lỗi đỏ** — không ai làm sai cả, chỉ là dữ liệu cũ.
4. `404` → đóng dialog, toast "Gói đăng ký không còn tồn tại.", refetch.

---

## 7. Yêu cầu chung

### 7.1 Accessibility

- Modal/dialog: focus trap, `Esc` để đóng, trả focus về phần tử đã kích hoạt khi đóng.
- Dialog xác nhận: `role="alertdialog"`, focus mặc định vào nút **Huỷ** (thao tác an toàn).
- Toast: vùng `aria-live="polite"`; lỗi dùng `assertive`.
- Mọi input có `<label>` liên kết; lỗi inline nối bằng `aria-describedby` + `aria-invalid`.
- Trạng thái gói không được chỉ truyền tải bằng màu — badge phải có chữ ("Đang bán" / "Ngừng bán").

### 7.2 Responsive

- S1: lưới card, tối thiểu 1 cột trên mobile. Các card trong một hàng nên cao bằng nhau để so sánh quyền lợi được.
- S2: bảng nhiều cột — trên mobile cho cuộn ngang trong container riêng, hoặc chuyển sang layout thẻ. Body trang không được cuộn ngang.

### 7.3 Đa ngôn ngữ

`errorMessage` từ BE là **tiếng Việt cứng**. Nếu sản phẩm cần i18n, FE phải tự map `errorCode` → chuỗi dịch và bỏ qua `errorMessage`. Hiện tại dùng thẳng `errorMessage` là chấp nhận được.

---

## 8. Truy vết AC → UI

| AC | Nơi đáp ứng |
|---|---|
| AC-09.1 | §2.2 card gói |
| AC-09.2 | §1.1 — giữ nguyên thứ tự API, FE không sort |
| AC-09.3 | BE đã lọc; FE không cần làm gì |
| AC-09.4 | §2.1 Empty state |
| AC-09.5 | §2.3 nhánh chưa đăng nhập |
| AC-09.6 | §2.3 nhánh đã đăng nhập |
| AC-09.7 | §2.3 — đăng nhập fail/huỷ → ở nguyên trang |
| AC-09.8 | §2.2 read-only tuyệt đối |
| AC-90.1 | §4.2 bước 3 |
| AC-90.2 → AC-90.9 | §0.4 validate client + §0.6 map lỗi |
| AC-90.10, AC-90.11 | §4.2 bước 4 (409 inline) |
| AC-90.12 | §3 guard role Admin |
| AC-90.13 | §4.2 bước 6 + §3.2 không optimistic |
| AC-91.1 | §5.2, §3.2 refetch |
| AC-91.2 | §5.1 render disabled |
| AC-91.3 → AC-91.8 | §0.4 + §0.6 |
| AC-91.9 | §5.3 bước 4 |
| AC-91.10 | §5.3 bước 5 |
| AC-91.11 | §3 guard role Admin |
| AC-92.1, AC-92.2 | §6.3 bước 2 |
| AC-92.3, AC-92.4 | §6.3 bước 3 |
| AC-92.5 | §6.1 bắt buộc xác nhận |
| AC-92.6 | §2.4 invalidate cache FE |
| AC-92.7 | §6.2 câu trấn an trong dialog |
| AC-92.8 | §6.3 bước 4 |
| AC-92.9 | §3 guard role Admin |

---

## 9. Ngoài phạm vi FE / đang chờ backend

| Hạng mục | Trạng thái | Ảnh hưởng tới FE |
|---|---|---|
| Sửa `durationInDays` (AC-91.1, AC-91.4) | ⚠️ BE chưa hỗ trợ | §5.1 — render read-only, **không** làm ô nhập |
| Cache danh sách gói | BE chưa có | §2.4 — FE tự quản lý cache nếu cần |
| Audit log | BE chưa có | Không có màn lịch sử thay đổi; đừng thiết kế UI cho nó |
| Optimistic concurrency (row version) | BE chưa có | Hai admin sửa cùng lúc → last-write-wins, **không có cảnh báo xung đột**. FE không mô phỏng được, đừng cố. |
| Trang mua / thanh toán | Ngoài phạm vi milestone | §2.3 chỉ chịu trách nhiệm tới bước điều hướng |

## 10. Câu hỏi cần BA chốt

1. Đơn vị tiền tệ có chắc là VND không? (hệ thống chưa lưu currency ở đâu cả)
2. Hiển thị `*Limit === 0` như thế nào — "Không bao gồm", "0", hay ẩn dòng đó?
3. `durationInDays` có hiển thị thô ("30 ngày") hay quy đổi ("1 tháng")?
4. Trang công khai đặt ở route nào — `/subscription-plans` hay `/pricing`?
