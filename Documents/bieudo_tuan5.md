# Biểu đồ UML - Báo cáo nộp cuối Tuần 5

Tài liệu này chứa các biểu đồ UML được yêu cầu cho sản phẩm nộp cuối Tuần 5 của dự án **Hiệu Sách Chin**:
1. **Biểu đồ Trạng thái (State Diagram)** cho 2 đối tượng chính: **Đơn hàng (Order)** và **Sản phẩm (Book/Product)**.
2. **Biểu đồ Hoạt động (Activity Diagram)** cho quy trình nghiệp vụ: **Quy trình Đặt hàng & Thanh toán trực tuyến**.

---

## 1. Biểu đồ Trạng thái (State Diagram) - Đơn hàng (Order)

Biểu đồ này mô tả vòng đời của một đơn hàng từ lúc được khách hàng khởi tạo, xác nhận, đóng gói, vận chuyển cho đến khi kết thúc (hoàn thành hoặc bị hủy).

```mermaid
stateDiagram-v2
    [*] --> PENDING : Khách đặt đơn mới (COD / Online)
    
    state PENDING {
        [*] --> Unpaid : Chọn thanh toán Online
        [*] --> Paid_COD : Chọn thanh toán COD
        Unpaid --> Paid_Online : Thanh toán qua PayOS thành công
        Unpaid --> CANCELLED : Hết hạn thanh toán (15p) / Khách hủy
    }

    PENDING --> CONFIRMED : Admin xác nhận đơn hàng
    PENDING --> CANCELLED : Khách hủy đơn / Admin từ chối đơn

    CONFIRMED --> PACKING : Thủ kho bắt đầu chuẩn bị hàng
    CONFIRMED --> CANCELLED : Khách yêu cầu hủy đơn (nếu được duyệt)

    PACKING --> SHIPPING : Bàn giao cho đơn vị vận chuyển
    
    SHIPPING --> DELIVERED : Giao hàng thành công cho khách
    SHIPPING --> CANCELLED : Giao hàng thất bại (Trả về kho)

    DELIVERED --> [*] : Hoàn tất đơn hàng
    CANCELLED --> [*] : Đơn hàng bị hủy hoàn toàn
```

---

## 2. Biểu đồ Trạng thái (State Diagram) - Sách / Sản phẩm (Product)

Biểu đồ này mô tả các trạng thái của một cuốn sách trong hệ thống quản lý của cửa hàng từ khi tạo bản nháp, xuất bản công khai, hết hàng, ẩn sản phẩm cho đến khi bị xóa khỏi hệ thống.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : PM tạo bản nháp sách mới
    DRAFT --> PUBLISHED : PM xuất bản (Hiển thị lên Storefront)
    DRAFT --> HIDDEN : PM lưu kho ẩn đi
    
    PUBLISHED --> OUT_OF_STOCK : Khách mua hết (Stock = 0)
    OUT_OF_STOCK --> PUBLISHED : Thủ kho nhập thêm hàng (Stock > 0)
    
    PUBLISHED --> HIDDEN : PM tắt hiển thị (Ẩn sách)
    HIDDEN --> PUBLISHED : PM bật hiển thị lại (Hiện sách)
    
    PUBLISHED --> [*] : Admin xóa sản phẩm (Soft delete)
    HIDDEN --> [*] : Admin xóa sản phẩm (Soft delete)
    DRAFT --> [*] : PM xóa bản nháp
```

---

## 3. Biểu đồ Hoạt động (Activity Diagram) - Quy trình Đặt hàng & Thanh toán Online

Biểu đồ mô tả quy trình nghiệp vụ mua hàng và thanh toán trực tuyến qua cổng PayOS/VietQR của khách hàng trên hệ thống.

```mermaid
graph TD
    %% Định nghĩa styling màu sắc
    classDef startEnd fill:#1a1714,stroke:#1a1714,color:#fff,font-weight:bold;
    classDef step fill:#f3f4f6,stroke:#9ca3af,stroke-width:1px,color:#1f2937;
    classDef decision fill:#fffbeb,stroke:#f59e0b,stroke-width:1.5px,color:#78350f,font-weight:bold;

    %% Khai báo các nút
    Start([Bắt đầu đặt hàng]):::startEnd
    Step1[Khách hàng thêm sách vào giỏ hàng & bấm Thanh toán]:::step
    Step2[Chọn địa chỉ nhận hàng & chọn phương thức Online]:::step
    Step3[Khách hàng xác nhận đặt hàng]:::step
    
    Dec1{Kiểm tra tồn kho?}:::decision
    StepErr[Hiển thị thông báo hết hàng & cập nhật giỏ]:::step
    EndErr([Kết thúc lỗi]):::startEnd
    
    StepCreate[Khởi tạo đơn hàng trạng thái PENDING & UNPAID]:::step
    StepPayOS[Gọi API PayOS tạo link thanh toán QR]:::step
    StepRedirect[Chuyển hướng khách sang trang quét mã QR]:::step
    
    Dec2{Khách quét mã thanh toán thành công?}:::decision
    StepCancel[Hủy đơn hàng sau 15 phút hoặc khi khách chủ động hủy]:::step
    EndCancel([Kết thúc - Hủy đơn]):::startEnd
    
    StepHook[PayOS gửi Webhook xác nhận thanh toán thành công]:::step
    StepUpdate[Hệ thống cập nhật đơn sang PAID & CONFIRMED]:::step
    StepNotify[Gửi email xác nhận & thông báo cho thủ kho chuẩn bị hàng]:::step
    StepPack[Thủ kho đóng gói & vận chuyển hàng cho khách]:::step
    EndSuccess([Kết thúc thành công]):::startEnd

    %% Luồng kết nối
    Start --> Step1
    Step1 --> Step2
    Step2 --> Step3
    Step3 --> Dec1
    
    Dec1 -- "Không đủ số lượng" --> StepErr
    StepErr --> EndErr
    
    Dec1 -- "Đủ tồn kho" --> StepCreate
    StepCreate --> StepPayOS
    StepPayOS --> StepRedirect
    StepRedirect --> Dec2
    
    Dec2 -- "Không thanh toán / Hủy" --> StepCancel
    StepCancel --> EndCancel
    
    Dec2 -- "Xác nhận thành công" --> StepHook
    StepHook --> StepUpdate
    StepUpdate --> StepNotify
    StepNotify --> StepPack
    StepPack --> EndSuccess
```
