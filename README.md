# Hệ Thống Quản Lý Văn Phòng Luật

Dự án Luận văn tốt nghiệp Đại học - Ngành Công nghệ Thông tin - Khóa K48.
Trường Công nghệ Thông tin và Truyền thông - Đại học Cần Thơ (CTU).

## Giới thiệu Đề tài

Dự án tập trung xây dựng hệ thống quản lý cho các văn phòng luật quy mô vừa và nhỏ. Hệ thống giúp số hóa quy trình tiếp nhận khách hàng, quản lý hồ sơ vụ việc, lịch hẹn và lưu trữ tài liệu pháp lý. Ngoài ra, dự án còn tích hợp trí tuệ nhân tạo để hỗ trợ tư vấn pháp luật tự động và kiểm tra xung đột lợi ích.

- Sinh viên thực hiện: Nguyễn Nhật Anh
- Mã số sinh viên: B2205924
- Giảng viên hướng dẫn: TS. Thái Minh Tuấn

## Công nghệ sử dụng

Hệ thống được phát triển theo mô hình Front-End và Back-End tách biệt, đảm bảo tính nhất quán và toàn vẹn dữ liệu.

| Thành phần             | Công nghệ sử dụng                     |
| :--------------------- | :------------------------------------ |
| Front-End              | ReactJS                               |
| Thư viện UI            | Ant Design                            |
| Back-End               | Django Framework (Python)             |
| Cơ sở dữ liệu          | PostgreSQL (hỗ trợ pgvector)          |
| Mô hình ngôn ngữ (LLM) | Llama-3.3-70B-Versatile               |
| Mã hóa Vector          | Paraphrase-multilingual-MiniLM-L12-v2 |
| Kiến trúc AI           | RAG (Retrieval-Augmented Generation)  |
| Kết nối hệ thống       | RESTful API                           |

## Các tính năng chính

Hệ thống được thiết kế để phục vụ 5 nhóm người dùng chính bao gồm Khách hàng, Tư vấn viên, Luật sư, Trợ lý luật sư và Quản lý.

- Quản lý vụ việc: Theo dõi tiến độ xử lý, quản lý hồ sơ và lưu trữ các hợp đồng, chứng cứ liên quan.
- Cảnh báo xung đột: Tự động đối chiếu thông tin để phát hiện và cảnh báo các trường hợp xung đột lợi ích khi tiếp nhận khách hàng mới.
- Chatbot tư vấn pháp luật: Sử dụng kiến trúc RAG để truy xuất thông tin chính xác từ các văn bản quy phạm pháp luật được quản lý.
- Quản lý lịch hẹn: Tổ chức và theo dõi lịch làm việc giữa khách hàng và đội ngũ luật sư.
- Thống kê báo cáo: Theo dõi doanh thu, số lượng vụ việc và hiệu suất làm việc của nhân viên trong văn phòng.

## Cấu trúc thư mục
```bash
LuanVan_Project/
├── api/              # App chính xử lý Logic Backend 
│ ├── tests/          # Chứa các kịch bản kiểm thử 
│ ├── models.py       # Định nghĩa cơ sở dữ liệu
│ ├── serializers.py  # Chuyển đổi dữ liệu sang dạng JSON cho API
│ ├── views.py        # Xử lý logic và phản hồi các yêu cầu từ Frontend
│ ├── urls.py         # Định nghĩa các đường dẫn API
│ └── vnpay.py        # Module tích hợp cổng thanh toán VNPay
├── backend_core/     # Cấu hình cốt lõi của dự án Django
│ ├── settings.py     # Thiết lập hệ thống, Database, Middleware, Auth
│ └── urls.py         # Điều hướng URL tổng của toàn hệ thống
├── frontend_web/     # Mã nguồn ứng dụng Client
│ ├── public/         # Tài nguyên tĩnh công khai
│ └── src/  
│ ├── api/            # Cấu hình gọi API từ Backend
│ ├── components/     # Các thành phần giao diện dùng chung
│ ├── layouts/        # Bố cục giao diện riêng cho từng vai trò
│ ├── pages/          # Các trang chức năng chính phân quyền theo User:
│ │ ├── admin/        # Giao diện quản lý
│ │ ├── assistant/    # Giao diện dành cho trợ lý luật sư 
│ │ ├── lawyer/       # Giao diện luật sư 
│ │ ├── consultant/   # Giao diện tư vấn viên
│ │ └── client/       # Giao diện dành cho khách hàng
│ ├── App.jsx         # Thành phần gốc định nghĩa luồng điều hướng
│ └── main.jsx        # Điểm khởi đầu của ứng dụng React
├── media/            # Lưu trữ tệp tin người dùng tải lên
│ ├── contracts/      # Lưu trữ các tệp hợp đồng điện tử
│ ├── documents/      # Tài liệu, hồ sơ vụ việc
│ └── images/         # Hình ảnh đại diện, minh họa
├── manage.py         # Công cụ dòng lệnh để thực thi các lệnh Django
└── db.sqlite3        # Cơ sở dữ liệu tạm thời 
```
# Hướng dẫn cài đặt

## Yêu cầu hệ thống

- Python >= 3.10
- Node.js >= 18
- PostgreSQL >= 14

## Cài đặt pgvector

### Tải file biên dịch sẵn của pgvector
```bash
github.com/pgvector/pgvector/releases
```
### Sao chép file .dll vào thư mục lib và các file .control, .sql vào thư mục share/extension trong đường dẫn cài đặt PostgreSQL

### Mở Query Tool trong pgAdmin hoặc SQL Shell và chạy lệnh:
```bash
CREATE EXTENSION IF NOT EXISTS vector
```
## BackEnd

- Tạo môi trường ảo
```bash
  python -m venv venv
  ```
- Kích hoạt môi trường
```bash
  venv\Scripts\activate
```
### Cài thư viện

- Dijango
```bash
  pip install django djangorestframework psycopg2-binary
```
### Cấu hình DB

- Trong file backend_core/settings.py
```bash
  DATABASES = {
  'default': {
  'ENGINE': 'django.db.backends.postgresql',
  'NAME': 'your_db',
  'USER': 'your_user',
  'PASSWORD': 'your_password',
  'HOST': 'localhost',
  'PORT': '5432',
  }
  }
  ```
  Thay bằng thông tin PostgreSQL của bạn

### Chạy migrate
```bash
python manage.py makemigrations
python manage.py migrate
```
### Tạo tài khoản admin
```bash
python manage.py createsuperuser
```
### Chạy server
```bash
python manage.py runserver
```
## FrontEnd

### Cài thư viện
```bash
npm install
```
### Chạy frontend
```bash
npm run dev
```
