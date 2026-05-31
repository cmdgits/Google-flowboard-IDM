# 🗺️ Bản Kế Hoạch Nâng Cấp Tổng Thể: Flowboard Cinema Generator

Tài liệu này ghi lại chi tiết các yêu cầu tính năng nâng cấp theo từng bước để biến Flowboard thành một hệ thống tự động hóa sản xuất phim dài, đồng nhất nhân vật và phong phú thể loại. Chúng ta sẽ thực hiện tuần tự từng bước cho tới khi hoàn thành dự án.

---

## 📋 Danh sách các Bước Nâng cấp

### 🟢 BƯỚC 1: TRIỂN KHAI NODE PHONG CÁCH (STYLE PRESET NODE) [HOÀN THÀNH]
* **Mục tiêu**: Người dùng có thể kéo thả một `Style Preset Node` (🎨) trên canvas, chọn phong cách (Anime Ghibli, Hollywood 35mm, 3D Pixar, v.v.). Khi kết nối node này với bất kỳ node video/ảnh nào, hệ thống tự động bơm các prompt nghệ thuật và negative prompt đồng bộ vào tiến trình tạo.
* **Các công việc cần làm**:
  - `[x]` Thêm `"style_preset"` vào danh sách loại node hỗ trợ ở Backend (`models.py`, `nodes.py`).
  - `[x]` Đăng ký loại node `"style_preset"` ở Frontend (`client.ts`, `board.ts`, `AddNodePalette.tsx`, `Board.tsx`).
  - `[x]` Thiết kế giao diện Card riêng biệt cho Style Preset Node trong `NodeCard.tsx` (hiển thị bộ chọn phong cách trực quan kèm ảnh danh sách phong cách).
  - `[x]` Chỉnh sửa API tạo ảnh/video ở frontend store (`generation.ts`) để tự động quét nếu có node phong cách liên kết đầu vào, tự động gộp prompt phong cách mẫu vào prompt tạo.
  - `[x]` Kiểm thử độc lập sự đồng bộ phong cách hình ảnh/video giữa các node.

---

### 🟢 BƯỚC 2: TRIỂN KHAI THUYẾT MINH AI (TTS - TEXT-TO-SPEECH) & LỒNG TIẾNG [HOÀN THÀNH]
* **Mục tiêu**: Cho phép viết lời thoại/thuyết minh ngay trên thẻ card Video Node. Khâu ghép nối video sẽ tự động sinh giọng đọc AI cho từng clip, căn chỉnh thời lượng và chèn lồng tiếng khớp với nhạc nền.
* **Các công việc cần làm**:
  - `[x]` Bổ sung trường `narration` (lời thuyết minh) vào cấu trúc dữ liệu của các node Video.
  - `[x]` Tích hợp thư viện Python `gTTS` hoặc `edge-tts` (nhẹ và miễn phí, hỗ trợ tiếng Việt cực hay) vào backend FastAPI.
  - `[x]` Cập nhật endpoint `/api/video-assembly/node/{node_id}/assemble` để:
    - Quét lời thoại trên từng node video đầu vào.
    - Chuyển văn bản lời thoại thành file audio `.mp3` thuyết minh riêng cho mỗi clip.
    - Căn khớp thời lượng video hoặc chỉnh tốc độ đọc của âm thanh cho khớp khung hình.
    - Trộn audio thuyết minh cùng nhạc nền (background audio) trước khi ghép thành phim hoàn chỉnh.
  - `[x]` Kiểm thử chất lượng thuyết minh tiếng Việt đồng bộ cùng phụ đề tự động.

---

### 🟢 BƯỚC 3: TÍNH NĂNG SINH VIDEO HÀNG LOẠT (BATCH GENERATION QUEUE) [HOÀN THÀNH]
* **Mục tiêu**: Một nút bấm duy nhất trên Video Assembly Node sẽ tự động xếp hàng và tạo (generate) toàn bộ các node video đầu vào chưa được vẽ, giúp người dùng không phải bấm thủ công từng thẻ card.
* **Các công việc cần làm**:
  - `[x]` Tạo endpoint backend `POST /api/video-assembly/node/{node_id}/generate-all` để tạo hàng loạt.
  - `[x]` Viết worker quản lý hàng đợi tạo video chạy song song/tuần tự ở backend.
  - `[x]` Cập nhật giao diện Video Assembly Card để hiển thị thanh tiến trình chạy hàng loạt (Ví dụ: *"Đang tạo clip 2/5..."*).
  - `[x]` Xử lý lỗi tự động bỏ qua hoặc thử lại nếu một clip nhỏ trong hàng đợi bị lỗi.

---

### 🟢 BƯỚC 4: NODE KỊCH BẢN AI THÔNG MINH (AI STORY SCRIPT NODE) [HOÀN THÀNH]
* **Mục tiêu**: Người dùng nhập cốt truyện ngắn, AI tự động phân cảnh chi tiết và **tự động vẽ/sinh ra một chuỗi các Node kịch bản mới** thẳng hàng trên Canvas, nối dây trực tiếp vào Video Assembly Node.
* **Các công việc cần làm**:
  - `[x]` Định nghĩa `story_script` NodeType mới ở cả frontend và backend.
  - `[x]` Viết thuật toán LLM Prompt phân tích cốt truyện thành JSON chứa danh sách các phân cảnh (Prompt hình ảnh + Prompt chuyển động).
  - `[x]` Triển khai API tạo node hàng loạt ở backend và cập nhật WebSocket/Store ReactFlow để vẽ tự động các node mới sinh ra trên Canvas với tọa độ `(x, y)` thẳng hàng.
  - `[x]` Kiểm thử tự động hóa luồng từ cốt truyện ra toàn bộ phim thô chỉ sau một cú click.

---

### 🟢 BƯỚC 5: TÍCH HỢP HOÁN ĐỔI MẶT NHÂN VẬT (INSIGHTFACE / REACTOR) [HOÀN THÀNH]
* **Mục tiêu**: Đảm bảo khuôn mặt nhân vật chính giống nhau tuyệt đối qua mọi clip phim bằng cách hậu xử lý đè khuôn mặt từ Node Character gốc lên tất cả video phân cảnh.
* **Các công việc cần làm**:
  - `[x]` Tích hợp thư viện xử lý ảnh `insightface` cùng model ONNX ở backend Python.
  - `[x]` Viết hàm quét khuôn mặt (Face Detection) và hoán đổi khuôn mặt (Face Swap) hậu kỳ sau khi clip video thô được tạo ra.
  - `[x]` Tối ưu hóa hiệu năng GPU/CPU để tiến trình hoán đổi mặt chạy nhanh gọn không gây khóa luồng.
  - `[x]` Xác minh độ chính xác đồng nhất nhân vật 100% trên video thành phẩm.

---

## 🛠️ Trạng thái dự án hiện tại

- **Bước hiện tại**: `[x]` Toàn bộ các bước nâng cấp đã hoàn thành xuất sắc!
- **Tiến độ**: 100% (5 / 5 Bước hoàn thành)
