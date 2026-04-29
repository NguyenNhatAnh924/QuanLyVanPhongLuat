import requests
import time
import json
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api/chat/"
SESSION_KEY = "5eou0we3sno"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc2NzUxMjAyLCJpYXQiOjE3NzY3NDA0MDIsImp0aSI6ImY5ZTlmYTEzYWVhNTRlN2U5Y2VjYjU3MTg4OTZhM2JiIiwidXNlcl9pZCI6IjIifQ.2g1RcSWd8yjZgV4hQREUAZTbWTLDSKMsWyZxIGsKEOI"

test_cases = [
    {"category": "Tư vấn Luật", "prompt": "Điều kiện để nam nữ kết hôn theo Luật Hôn nhân và Gia đình 2014 là gì?"},
    {"category": "Tư vấn Luật", "prompt": "Ai có quyền yêu cầu giải quyết ly hôn theo quy định hiện hành?"},
    
    {"category": "Tư vấn Luật", "prompt": "Người lao động được đơn phương chấm dứt hợp đồng lao động mà không cần báo trước trong trường hợp nào?"},
    {"category": "Tư vấn Luật", "prompt": "Thời gian thử việc tối đa đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn kỹ thuật cao là bao lâu?"},
    
    {"category": "Tư vấn Luật", "prompt": "Luật Đất đai 2024 quy định như thế nào về các trường hợp thu hồi đất để phát triển kinh tế - xã hội?"},
    {"category": "Tư vấn Luật", "prompt": "Quyền và nghĩa vụ của người sử dụng đất theo Luật Đất đai mới nhất?"},
    
    {"category": "Tư vấn Luật", "prompt": "Đối tượng nào phải nộp thuế thu nhập cá nhân theo quy định năm 2025?"},
    {"category": "Tư vấn Luật", "prompt": "Các khoản thu nhập nào được miễn thuế thu nhập cá nhân?"},
    
    {"category": "Tư vấn Luật", "prompt": "Đối tượng áp dụng của Nghị định 293 là những ai?"},
    {"category": "Tư vấn Luật", "prompt": "Thời điểm có hiệu lực thi hành của Nghị định 293 được quy định tại điều nào?"},
    
    {"category": "Tư vấn Luật", "prompt": "Trích dẫn nguyên văn Khoản 1 Điều 8 Luật Hôn nhân và gia đình."},
    {"category": "Tư vấn Luật", "prompt": "Mức lương tối thiểu vùng theo quy định mới nhất trong dữ liệu của bạn là bao nhiêu?"},
    {"category": "Tư vấn Luật", "prompt": "Thời gian nghỉ ngơi giữa ca làm việc theo Luật lao động 2019 quy định như thế nào?"},
    {"category": "Tư vấn Luật", "prompt": "Thủ tục đăng ký biến động đất đai theo Luật Đất đai 2024?"},
    
    {"category": "Dịch vụ", "prompt": "Văn phòng có gói dịch vụ nào hỗ trợ thủ tục làm Sổ đỏ không?"},
    {"category": "Dịch vụ", "prompt": "Chi phí tư vấn Luật lao động là bao nhiêu?"},
    {"category": "Lịch hẹn", "prompt": "Tôi muốn đặt lịch gặp Luật sư để tư vấn về tranh chấp đất đai."},
    {"category": "Lịch hẹn", "prompt": "Cho tôi xem danh sách lịch hẹn hiện tại của tôi."},
    
    {"category": "Ngoại lệ", "prompt": "Bạn có thể viết giúp tôi một bài thơ về thành phố Cần Thơ không?"},
    {"category": "Ngoại lệ", "prompt": "Hướng dẫn tôi cách cài đặt Windows 11."}
]

def run_test():
    results = []
    total_time = 0
    print(f"Bắt đầu kiểm thử Chatbot - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 80)

    for i, test in enumerate(test_cases):
        payload = {
            "prompt": test["prompt"],
            "session_key": SESSION_KEY
        }
        headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        }
        start_time = time.time()
        try:
            response = requests.post(API_URL, json=payload, headers=headers, timeout=60)
            end_time = time.time()
            
            latency = round(end_time - start_time, 3)
            total_time += latency
            
            if response.status_code == 200:
                answer = response.json().get("answer", "")
                is_legal = response.json().get("is_legal", False)
                status = "PASS"
            else:
                answer = f"Lỗi: {response.status_code}"
                is_legal = False
                status = "FAIL"
                
        except Exception as e:
            latency = 0
            answer = str(e)
            status = "ERROR"

        print(f"Câu {i+1}/{len(test_cases)} | {status} | Thời gian: {latency}s")
        
        results.append({
            "id": i + 1,
            "category": test["category"],
            "question": test["prompt"],
            "answer": answer,
            "is_legal_detected": is_legal,
            "response_time": latency
        })

    avg_time = round(total_time / len(test_cases), 3)
    
    report_filename = f"chatbot_test_report_{int(time.time())}.json"
    with open(report_filename, "w", encoding="utf-8") as f:
        json.dump({"summary": {"average_latency": avg_time, "total_cases": len(test_cases)}, "details": results}, f, ensure_ascii=False, indent=4)

    print("-" * 80)
    print(f"Hoàn thành! Thời gian phản hồi trung bình: {avg_time}s")
    print(f"Đã xuất báo cáo chi tiết ra file: {report_filename}")

if __name__ == "__main__":
    run_test()