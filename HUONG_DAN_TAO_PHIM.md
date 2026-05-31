# 🎬 CẨM NANG HƯỚNG DẪN: SẢN XUẤT PHIM ĐIỆN ẢNH TỰ ĐỘNG VỚI FLOWBOARD CINEMA

Chào mừng bạn đến với hệ thống tự động hóa sản xuất phim dài, đồng nhất nhân vật và phong phú thể loại của **Flowboard Cinema**. Tài liệu này sẽ hướng dẫn bạn chi tiết từng bước dễ hiểu nhất để tạo nên những bộ phim điện ảnh chất lượng cao chỉ bằng vài cú click chuột!

---

## 🗺️ SƠ ĐỒ ĐI DÂY (KẾT NỐI CANVAS)

Để hệ thống hoạt động trơn tru, đây là sơ đồ kết nối các thẻ card (Node) trên màn hình của bạn:

### 1. Luồng Cơ Bản (Mặc định)
AI sẽ tự động tạo và nối dây chuỗi này cho bạn ngay sau khi bạn nhập cốt truyện:
```text
[▣ Image] (Ảnh gốc) ───► [▶ Video] (Đoạn phim) ───► [🎬 Video Assembly] (Ghép phim)
```

### 2. Luồng Nâng Cao (Thêm Phong cách & Nhân vật chính)
Nếu muốn phim có phong cách nghệ thuật (như hoạt hình Ghibli) và khuôn mặt nhân vật chính giống nhau tuyệt đối 100% qua mọi cảnh, bạn chỉ cần nối dây thêm như sau:
```text
[🎨 Style Preset] (Chọn phong cách) ────────┐
                                            ├─────► [▣ Image] (Ảnh) ───► [▶ Video] (Clip) ───► [🎬 Video Assembly] (Ghép Phim)
[◎ Character] (Đồng nhất khuôn mặt) ────────┘
```
> [!IMPORTANT]
> **Quy tắc quan trọng:** Thẻ Phong cách (🎨) và Nhân vật (◎) luôn luôn nối dây vào thẻ **Image (▣)** chứ không nối vào thẻ Video. Thẻ Video sau đó sẽ tự động kế thừa và tạo chuyển động theo bức ảnh mở đầu đó.

---

## 📋 HƯỚNG DẪN 5 GIAI ĐOẠN SẢN XUẤT PHIM CHI TIẾT

### GIAI ĐOẠN 1: CHUẨN BỊ CANVAS (Đi dây cơ bản)
1. **Tạo thẻ Assembly**: Nhấn nút **🎬 Video Assembly** trên thanh công cụ phía trên để tạo thẻ ghép phim.
2. **Tạo thẻ Kịch bản**: Nhấn nút **📝 Story Script** trên thanh công cụ để tạo thẻ nhập cốt truyện.
3. **Nối dây**: Giữ chuột và kéo một đường nối từ nút tròn bên phải của thẻ **Story Script** sang nút tròn bên trái của thẻ **Video Assembly**.

---

### GIAI ĐOẠN 2: ĐỂ AI TỰ VẼ KỊCH BẢN (Story Script)
1. **Nhập ý tưởng**: Trên thẻ **Story Script**, bạn hãy gõ cốt truyện bạn muốn làm phim bằng tiếng Việt bình thường.
   * *Ví dụ:* `"Một chiến binh Viking dũng cảm đi tìm thanh kiếm truyền thuyết bị thất lạc trong hang đá băng tuyết cổ xưa."`
2. **Kích hoạt AI**: Nhấn nút **✦ Tự động phân cảnh** trên thẻ.
3. **Chờ kết quả**: Hệ thống sẽ tự động gọi AI phân tích cốt truyện, tự sinh ra 3 đến 5 cặp thẻ card **Image (▣)** & **Video (▶)** tương ứng với các cảnh phim, tự điền Prompt, tự viết sẵn thuyết minh tiếng Việt và tự nối dây hoàn chỉnh sang thẻ **Video Assembly** cho bạn!

---

### GIAI ĐOẠN 3: THÊM NÂNG CAO (Phong cách & Nhân vật) - *Tùy chọn*
Nếu bạn muốn phim trông chuyên nghiệp hơn:
1. **Áp phong cách nghệ thuật**:
   * Nhấn nút **🎨 Style Preset** trên thanh công cụ.
   * Nhấp chọn 1 trong 6 phong cách yêu thích trên thẻ (ví dụ: *🎬 Hollywood* để làm phim điện ảnh sắc nét, hoặc *🎨 Ghibli Art* để làm hoạt hình).
   * Kéo dây từ thẻ **Style Preset** cắm vào các thẻ **Image (▣)** của các cảnh.
2. **Đồng nhất khuôn mặt nhân vật**:
   * Nhấn nút **◎ Character** trên thanh công cụ.
   * Tải ảnh khuôn mặt nhân vật chính của bạn lên thẻ này (hoặc viết prompt sinh một khuôn mặt mới).
   * Kéo dây từ thẻ **Character** cắm vào các thẻ **Image (▣)** của các cảnh.

---

### GIAI ĐOẠN 4: TẠO VIDEO HÀNG LOẠT (⚡ Batch Generate)
Bây giờ mọi thứ đã sẵn sàng trên Canvas, bạn không cần phải nhấn nút Generate lẻ tẻ trên từng thẻ nữa:
1. **Mở bảng điều khiển**: Nhấp đúp chuột (Double-click) vào thẻ **🎬 Video Assembly**.
2. **Bắt đầu sinh hàng loạt**: Bạn sẽ thấy danh sách các phân cảnh hiện ra đầy đủ. Hãy nhấn nút **⚡ Tạo hàng loạt [N] clip chưa vẽ** màu tím rực rỡ ở ngay đầu danh sách.
3. **Theo dõi tiến độ**: Một thanh tiến trình chạy phần trăm cực kỳ mượt mà sẽ xuất hiện. Bạn chỉ cần ngồi thư giãn uống cafe và xem các thẻ card trên màn hình tự động chuyển trạng thái vẽ từ `Queued (Chờ) ➔ Running (Đang tạo) ➔ Done (Hoàn thành)`.

---

### GIAI ĐOẠN 5: GHÉP NHẠC NỀN & BIÊN TẬP PHIM HOÀN CHỈNH
Khi toàn bộ các cảnh phim đã được vẽ xong (tiến trình đạt 100%):
1. **Nhập nhạc nền**: Trong bảng điều khiển Video Assembly, nhấp nút **🎵 Nhập nhạc nền** để tải lên bài nhạc nền bạn thích từ máy tính (Hỗ trợ mọi định dạng `.mp3`, `.wav`, `.m4a`, `.flac`...).
2. **Sắp xếp thứ tự**: Bạn có thể kéo thả trực tiếp các dòng cảnh phim lên xuống để thay đổi thứ tự kể chuyện nếu muốn.
3. **Biên tập phim cuối**: Nhấn nút **Bắt đầu ghép nối 🎬** ở góc dưới bên phải.
   * *Hệ thống tự động:*
     * Kết nối các đoạn video ngắn lại với nhau cực kỳ mượt mà.
     * Chuyển toàn bộ các dòng chữ kịch bản thuyết minh tiếng Việt thành giọng đọc AI tự nhiên lồng khớp vào từng cảnh phim.
     * Tự động trộn nhạc nền và **giảm âm lượng nhạc nền xuống 20%** mỗi khi có tiếng thuyết minh AI cất lên, đảm bảo người xem nghe rõ lời thuyết minh nhất.
4. **Tải về**: Chờ vài giây và bạn sẽ nhận được video thành phẩm chất lượng cao để xem trực tiếp, tải về máy hoặc dùng tiếp thẻ `Social Block` đăng lên mạng xã hội!

---

## 💡 MẸO NHỎ KHI LÀM PHIM

* **Prompt Kịch Bản Hay**: Khi nhập cốt truyện ở Giai đoạn 2, cốt truyện càng giàu tính hình ảnh, AI phân cảnh sẽ càng vẽ ảnh và tạo video đẹp mắt và chuẩn xác.
* **Thời Lượng Thuyết Minh**: Lời thuyết minh cho mỗi cảnh nên ngắn gọn (khoảng 1-2 câu ngắn). Hệ thống sẽ tự động tính toán kéo giãn thời lượng video hoặc khớp tốc độ đọc thuyết minh sao cho khớp khung hình nhất có thể!

Chúc bạn tạo ra được những thước phim điện ảnh tuyệt vời nhất cùng Flowboard Cinema! Nếu có bất kỳ câu hỏi nào trong quá trình thao tác, mình luôn sẵn sàng trợ giúp bạn. 🚀
