# ĐÀO SÂU TRONG MODULE 5: BẢNG TIẾN ĐỘ CÁ NHÂN (DASHBOARD MODULE)

Khác với Module 2 & 3 (Tập trung không gian chia theo Project), Module 5 là không gian **Riêng tư và Quy tụ (Aggregated Privacy)**. Tính năng Dashboard này lấy toàn bộ các công việc có "gắn mác tên bạn" rải rác ở hàng chục các Project khác nhau về một màn hình, giúp bạn bao quát những gì mình cày cuốc ngày hôm nay.

---

## 🎯 Sub-Item 1: API Quét Trạm Tuyệt Đối (Fetch User Tasks)

Đây là chức năng tách biệt hoàn toàn khởi Route Project. Nó đứng độc lập trực thuộc Route dành riêng cho User (`/api/v1/users/me/tasks`).

* **Thiết lập Routing:** `GET /api/v1/users/me/tasks` (Chặn bằng Auth Middleware Protect)
* **Thuật Toán Truy Vấn Quét Sạch (MongoDB Filter):**
  1. Service nhận thông số đầu vào chính là ID bản thân người dùng đăng nhập (`req.user.id`).
  2. Câu lệnh Mongoose cốt tử: 
     `Task.find({ assignee: req.user.id, status: { $ne: 'Done' } }).populate('projectId', 'name')`
  3. Lệnh này mang tầng nghĩa: Lấy móc hết toàn bộ Collection Task ra đây, lôi mấy cái Task có dính cái nhãn `assignee` là tôi (Tôi bị người ta giao việc). Và lọc luôn (bỏ ra) những Task nào đã làm xong `status != Done` để tránh rác mắt màn hình Dashboard.
  4. Lệnh `.populate('projectId')` lôi tên của Project sở hữu nó ra để User biết "À cái việc khỉ nợ này thuộc Project Nhóm A".

---

## 🚨 Sub-Item 2: Xử Lý Biến Động Deadline - Báo Động Đỏ (Overdue Logic) 

Đây là chức năng tính điểm logic. Quá trình phán xét 1 tấm thẻ bị quá hạn (Overdue) không nên lưu cứng cờ cắm `isOverdue: true` thành 1 cột ở CSDL (vì tốn dung lượng cập nhật, do thời gian luôn trôi, ngày mai nó tự khắc Overdue).

* **Thuật toán Map Logic "On the fly" (Tính toán trên Mây) tại Tầng Service:**
  Khi `Task.find()` gọi ra được một Mảng Array gốc gồm cỡ chục cái Task, ta cho đi qua 1 vòng lặp chế biến dữ liệu trước khi Response Data JSON về:
  
  ```javascript
  const today = new Date();
  
  const formattedTasks = tasks.map(task => {
    // Ép kiểu Data thuần sang Object thao tác lỏng (Ngoại trừ việc dùng .lean() từ Mongoose)
    const taskObj = task.toObject(); 

    // Logic: Nếu nhiệm vụ có gõ Deadline, và Deadline đó nhỏ hơn hôm nay (Thời gian trôi về quá khứ) -> Nghĩa là Bạn Trễ Mẹ Nó Rồi!
    let isOverdue = false;
    if (task.deadline && new Date(task.deadline) < today) {
        isOverdue = true;
    }
    
    // Gắn thêm thuốc tính ảo isOverdue bằng tay vào JSON Payload
    taskObj.isOverdue = isOverdue;
    return taskObj;
  });
  
  return formattedTasks;
  ```

* **Hiệu Ngữ Chuyển Dịch UI:** 
  Hành động này giúp Backend tuồn ra cái cờ `isOverdue: true/false`. Anh em thiết kế Frontend gõ lệnh JSX render HTML bắt check nếu cờ `true` thì lập tức tô cái Background tấm thẻ task màu Vàng Nhạt Báo Động, để thẻ có tag màu Đỏ chót "Trễ hạn ráng cố lên". Đạt yêu cầu giao diện UX tốt của đề bài.

---

## 📈 Sub-Item 3: Phân Bổ Mảng Tình Trạng (Status Grouping For Client)

Để Dashboard nhìn giống như một khu trung tâm quản trị chứ không phải 1 cái list dài nhàm chán thẳng tuột, ta có thể giúp Frontend bớt tính toán bằng việc "Nấu Món Gom Nhóm Nhét Hộp" (Aggregation/Grouping) ngay từ Backend cho nó ngầu.

* **Thuật Toán Format Trả Về Payload (JSON Build):**
  Thay vì vả nguyên array `10 tasks` ra cho Client. Hàm Service xây 1 mảng DTO Data Transfer cấu trúc lại đống đổ nát ở sub-item 2:
  
  ```json
  // Payload Trả bề JSON Dạng Map Tĩnh
  {
    "status": "success",
    "dashboard_data": {
      "counts": {
          "total_unfinished": 25,
          "overdue_count": 8,
          "doing_count": 17
      },
      "grouped_tasks": {
          "overdue": [ { task_1 }, { task_2 }... ],
          "in_progress": [ { task_3 }, ...],
          "todo": [ { task_5 }, ...]
      }
    }
  }
  ```

* **Lợi ích cấu trúc gom nhóm:** Lúc Backend làm cực như thế này, Frontend xài React hay xài EJS chỉ cần lòi 3 vòng for tách biệt ra 3 Section bự tướng: Mục "Cảnh báo cháy nhà (overdue map)", Mục "Đang cuốc (inprogress)", đem lại giao diện Mini Trello thực thụ rất Pro mà Giảng viên thường phải cho Full Điểm phần Logic cá nhân.

---
Và tới đây là Dashboard xong, với sự mỏng gọn nhất nhì dự án nhưng mang hàm lượng bóp thuật toán (JS Native) dội ngược thay vì chỉ hì hục thao tác CRUD truyền thống. Quá đơn giản mà lại rất ăn điểm!
