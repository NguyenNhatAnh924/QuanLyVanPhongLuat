import json
import os
from django.core.management.base import BaseCommand
from api.models import LawReference, LegalKnowledgeChunk, embed_model

class Command(BaseCommand):
    help = 'Nạp dữ liệu luật từ file JSON vào Database'

    def add_arguments(self, parser):
        # Cho phép bạn truyền đường dẫn file JSON khi chạy lệnh
        parser.add_argument('json_file', type=str, help='Đường dẫn tới file JSON')

    def handle(self, *args, **options):
        json_file = options['json_file']
        
        if not os.path.exists(json_file):
            self.stdout.write(self.style.ERROR(f'File không tồn tại: {json_file}'))
            return

        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if not data:
            return

        # 1. Lấy tên luật từ bản ghi đầu tiên để tạo LawReference (Bảng Cha)
        law_name = data[0].get('law')
        law_ref, created = LawReference.objects.get_or_create(law_name=law_name)
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Đã tạo mới bộ luật: {law_name}'))

        # 2. Chuẩn bị danh sách để bulk_create (tăng tốc độ nạp)
        chunks_to_create = []
        self.stdout.write(f'Đang tính toán Vector cho {len(data)} điều luật...')

        for item in data:
            content = item.get('content')
            title = item.get('title')

            # Kiểm tra xem Điều này đã nạp chưa để tránh trùng
            if not LegalKnowledgeChunk.objects.filter(law_reference=law_ref, title=title).exists():
                # Tạo Embedding (Vector)
                vector = embed_model.encode(content).tolist()
                
                chunks_to_create.append(LegalKnowledgeChunk(
                    law_reference=law_ref,
                    title=title,
                    content=content,
                    embedding=vector
                ))

        # 3. Lưu vào DB
        if chunks_to_create:
            LegalKnowledgeChunk.objects.bulk_create(chunks_to_create)
            self.stdout.write(self.style.SUCCESS(f'✅ Đã nạp thành công {len(chunks_to_create)} điều luật!'))
        else:
            self.stdout.write(self.style.WARNING('Chưa có dữ liệu mới nào được thêm vào.'))