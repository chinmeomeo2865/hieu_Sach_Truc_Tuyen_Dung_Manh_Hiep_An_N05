# Use-Case Diagram: Warehouse Keeper Role (Thủ Kho)

Tài liệu này mô tả chi tiết sơ đồ Usecase và các chức năng của vai trò **Thủ Kho (Warehouse Keeper)** trong hệ thống **Hiệu Sách Chin**.

---

## 1. Sơ đồ Use-Case (Mermaid)

Sơ đồ dưới đây phân loại các tính năng của Thủ kho thành các phân hệ quản lý kho chuyên biệt.

```mermaid
graph TB
    %% Định nghĩa phong cách màu sắc (Styling Classes)
    classDef actorStyle fill:#1a1714,stroke:#1a1714,stroke-width:2px,color:#faf8f5,font-weight:bold;
    classDef authStyle fill:#fee2e2,stroke:#f87171,stroke-width:1.5px,color:#991b1b;
    classDef dashStyle fill:#e0f2fe,stroke:#38bdf8,stroke-width:1.5px,color:#0369a1;
    classDef invStyle fill:#dcfce7,stroke:#4ade80,stroke-width:1.5px,color:#166534;
    classDef orderStyle fill:#faf5ff,stroke:#c084fc,stroke-width:1.5px,color:#6b21a8;
    classDef auditStyle fill:#fef3c7,stroke:#fbbf24,stroke-width:1.5px,color:#92400e;
    classDef ledgerStyle fill:#e6fffa,stroke:#4fd1c5,stroke-width:1.5px,color:#234e52;

    %% Tác nhân (Actor)
    WarehouseKeeper["👤 Thủ kho<br>(Warehouse Keeper)"]:::actorStyle

    %% Phân hệ 1: Xác thực
    subgraph Sub_Auth ["🔒 Xác thực & Bảo mật"]
        UC_Login("(Đăng nhập Portal Thủ kho)"):::authStyle
        UC_Logout("(Đăng xuất)"):::authStyle
    end

    %% Phân hệ 2: Dashboard
    subgraph Sub_Dash ["📊 Tổng quan & Thống kê"]
        UC_Stats("(Xem chỉ số kho realtime)"):::dashStyle
        UC_LowStock("(Xem cảnh báo sách sắp hết)"):::dashStyle
        UC_RecentAct("(Xem nhật ký hoạt động nhanh)"):::dashStyle
    end

    %% Phân hệ 3: Quản lý tồn kho
    subgraph Sub_Inv ["📦 Quản lý tồn kho"]
        UC_ViewInv("(Xem danh mục tồn kho)"):::invStyle
        UC_Restock("(Nhập hàng - Tăng tồn kho)"):::invStyle
        UC_WriteOff("(Báo hỏng / Xuất hủy - Giảm tồn)"):::invStyle
    end

    %% Phân hệ 4: Xử lý Đơn hàng
    subgraph Sub_Order ["🚚 Xử lý Đơn hàng"]
        UC_ViewOrders("(Xem danh sách đơn hàng cần xử lý)"):::orderStyle
        UC_Packing("(Đóng gói đơn hàng - PACKING)"):::orderStyle
        UC_Shipping("(Bàn giao vận chuyển - SHIPPING)"):::orderStyle
        UC_Delivered("(Xác nhận giao thành công - DELIVERED)"):::orderStyle
    end

    %% Phân hệ 5: Kiểm kho & Hàng hoàn
    subgraph Sub_AuditReturn ["🔍 Kiểm kho & Hàng hoàn"]
        UC_Audit("(Kiểm kê & Điều chỉnh số lượng thực tế)"):::auditStyle
        UC_AuditHistory("(Xem lịch sử các đợt kiểm kho)"):::auditStyle
        UC_ProcessReturn("(Xử lý đơn hàng hoàn trả)"):::auditStyle
    end

    %% Phân hệ 6: Thẻ kho & Nhật ký
    subgraph Sub_Ledger ["📖 Thẻ kho & Nhật ký"]
        UC_Ledger("(Xem Lịch sử giao dịch - Thẻ kho)"):::ledgerStyle
        UC_FilterLedger("(Lọc thẻ kho theo loại nghiệp vụ)"):::ledgerStyle
        UC_ActivityLog("(Xem chi tiết Nhật ký hoạt động kho)"):::ledgerStyle
    end

    %% Kết nối từ Actor đến các Use-cases
    WarehouseKeeper --> UC_Login
    WarehouseKeeper --> UC_Logout

    WarehouseKeeper --> UC_Stats
    WarehouseKeeper --> UC_LowStock
    WarehouseKeeper --> UC_RecentAct

    WarehouseKeeper --> UC_ViewInv
    WarehouseKeeper --> UC_Restock
    WarehouseKeeper --> UC_WriteOff

    WarehouseKeeper --> UC_ViewOrders
    WarehouseKeeper --> UC_Packing
    WarehouseKeeper --> UC_Shipping
    WarehouseKeeper --> UC_Delivered

    WarehouseKeeper --> UC_Audit
    WarehouseKeeper --> UC_AuditHistory
    WarehouseKeeper --> UC_ProcessReturn

    WarehouseKeeper --> UC_Ledger
    WarehouseKeeper --> UC_FilterLedger
    WarehouseKeeper --> UC_ActivityLog

    %% Mối quan hệ Include & Extend
    UC_Restock -.->|"<<extend>>"| UC_ViewInv
    UC_WriteOff -.->|"<<extend>>"| UC_ViewInv
    UC_Audit -.->|"<<include>>"| UC_AuditHistory
    UC_FilterLedger -.->|"<<include>>"| UC_Ledger
