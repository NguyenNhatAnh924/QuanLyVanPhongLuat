from django.db import models
import random
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db.models.signals import post_save
from django.dispatch import receiver
from pgvector.django import VectorField, CosineDistance, HnswIndex
from sentence_transformers import SentenceTransformer
from django.utils import timezone

embed_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

ROLE = [
    (0, "Khách hàng"),
    (1, "Tư vấn viên"),
    (2, "Trợ lý luật sư"),
    (3, "Luật sư"),
    (4, "Quản lý"),
]

ACCOUNT_STATUS =[
    (0, "Hoạt Động"),
    (1, "Khóa"),
]

class MyUserManager(BaseUserManager):
    def create_user(self, user_name, user_email, password=None, **extra_fields):
        if not user_email:
            raise ValueError("Email đang trống.")
        if not user_name:
            raise ValueError('Bắt buộc phải có Tên đăng nhập.')
        user_email = self.normalize_email(user_email)
        user = self.model(user_name=user_name, user_email = user_email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, user_name, user_email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_role', 4)
        return self.create_user(user_name, user_email, password, **extra_fields)
    
class Users(AbstractBaseUser, PermissionsMixin):
    user_id = models.BigAutoField(primary_key=True)
    user_fullName = models.CharField(max_length=255,blank=True)
    user_name = models.CharField(max_length=50, blank=True, unique=True)
    user_phone = models.CharField(max_length=10, blank=True)
    user_email = models.EmailField(
        max_length=255,
        unique=True,
    )
    user_address = models.CharField(max_length=255, blank=True)
    user_role = models.IntegerField(choices=ROLE,default=0)
    user_avatar = models.ImageField(max_length=255, blank=True)
    user_status = models.IntegerField(choices=ACCOUNT_STATUS, default=0)
    is_active = models.BooleanField(default=True) 
    is_staff = models.BooleanField(default=False) 
    embedding = VectorField(dimensions=384, null=True, blank=True)
    USERNAME_FIELD = 'user_name' 
    REQUIRED_FIELDS = ['user_email'] 

    objects = MyUserManager() 

    def __str__(self):
        return self.user_name
    
    class Meta:
        verbose_name = "Nguoi dung"
        verbose_name_plural = "Quan ly nguoi dung"

class StaffProfile(models.Model):
    user = models.OneToOneField(
        Users, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        related_name='staff_profile'
    )
    specialization = models.CharField(max_length=255, blank=True, verbose_name="Chuyên môn") 
    license_number = models.CharField(
        max_length=50, blank=True, 
        verbose_name="Số thẻ hành nghề"
    )
    experience_years = models.IntegerField(default=0, verbose_name="Số năm kinh nghiệm")
    bio = models.TextField(blank=True, verbose_name="Giới thiệu bản thân")
    date_joined = models.DateField(blank=True, null=True, verbose_name='Ngày tham gia văn phòng.')

    def __str__(self):
        return f"Staff: {self.user.user_name}"

@receiver(post_save, sender=Users)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.user_role in [1, 2, 3,4]:
            StaffProfile.objects.create(user=instance)

class ServicePackage(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên gói (VD: Tư vấn ly hôn trọn gói)")
    description = models.TextField(verbose_name="Mô tả phạm vi công việc")
    price = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="Giá niêm yết (VNĐ)")
    
    is_active = models.BooleanField(default=True, verbose_name="Đang kinh doanh")

    def __str__(self):
        return f"{self.name} ({self.price} VNĐ)"

class CaseStage(models.TextChoices):
    CONSULTING = 'CONSULTING', 'Tư vấn pháp lý'
    PREPARING = 'PREPARING', 'Chuẩn bị hồ sơ'
    ACCEPTED = 'ACCEPTED', 'Tòa án thụ lý'
    PRE_TRIAL = 'PRE_TRIAL', 'Tiền xét xử (Hòa giải/Đối chất)'
    FIRST_INSTANCE = 'FIRST_INSTANCE', 'Xét xử Sơ thẩm'
    APPEAL = 'APPEAL', 'Xét xử Phúc thẩm'
    ENFORCEMENT = 'ENFORCEMENT', 'Thi hành án'


CASE_STATUS = [   
    ('PROCESSING', 'Đang xử lý'),    
    ('CONFIRMED', 'Xác nhận'),     
    ('CANCELLED', 'Đã hủy'),      
    ('REJECTED', 'Từ chối'),
    ('LIQUIDATED', 'Hoàn thành')   
]

GOAL_STATUS = [
    (0, "Chưa xác định"),
    (1, "Đạt mong muốn"),
    (2, "Không đạt mong muốn"),
]

class LegalCase(models.Model):
    client = models.ForeignKey(
        Users, 
        on_delete=models.PROTECT, 
        related_name='cases_requested', 
        verbose_name="Khách hàng"
    )
    consultant = models.ForeignKey(
        Users, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        limit_choices_to={'user_role': 1}, 
        related_name='consulted_cases',
        verbose_name="Tư vấn viên tiếp nhận"
    )

    assigned_lawyer = models.ForeignKey(
        Users, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        limit_choices_to={'user_role': 3}, 
        related_name='handled_cases',
        verbose_name="Luật sư chuyên môn"
    )

    assistant = models.ForeignKey(
        Users, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        limit_choices_to={'user_role': 2}, 
        related_name='assisted_cases',
        verbose_name="Trợ lý hỗ trợ (Nếu có)"
    )
    service_package = models.ForeignKey(
    ServicePackage, 
    on_delete=models.SET_NULL, 
    null=True, blank=True, 
    related_name='cases',
    verbose_name="Gói dịch vụ áp dụng"
    )
    opposing_party_name = models.CharField(max_length=255, verbose_name="Tên của bên đối lập")
    opposing_party_address = models.CharField(max_length=255,verbose_name="Địa chỉ bên đối lập")
    title = models.CharField(max_length=255, verbose_name='Tiêu đề')
    description = models.TextField(verbose_name="Nội dung vụ việc")
    status = models.CharField(
        max_length=50, 
        choices=CASE_STATUS, 
        default='PROCESSING', 
        verbose_name='Trạng thái yêu cầu'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo yêu cầu')
    
    goal_achievement_status = models.IntegerField(
        choices=GOAL_STATUS,
        default=0,
        verbose_name="Kết quả xác nhận bởi CSKH"
    )

    verified_by = models.ForeignKey(
        'Users',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'user_role': 1}, 
        related_name='cases_verified',
        verbose_name="Tư vấn viên xác nhận"
    )

    verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Thời điểm xác nhận"
    )
    
    is_coi_flagged = models.BooleanField(default=False, verbose_name="Cảnh báo Xung đột")
    coi_note = models.TextField(blank=True, verbose_name="Chi tiết cảnh báo COI")
    def save(self, *args, **kwargs):
        print("\n========== [DEBUG COI CHECK START] ==========")
        print(f"Case ID: {self.pk}")
        print(f"Opposing Name: {self.opposing_party_name}")
        print(f"Opposing Address: {self.opposing_party_address}")

        if not self.pk and self.opposing_party_name:
            from sentence_transformers import SentenceTransformer
 
            embed_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            
            query_text = f"{self.opposing_party_name} - {self.opposing_party_address}"
            print(f"[DEBUG] Query Text: {query_text}")

            query_vector = embed_model.encode(query_text).tolist()
            print(f"[DEBUG] Vector length: {len(query_vector)}")

            suspect_clients = Users.objects.filter(
                user_role=0,
                cases_requested__contracts__isnull=False 
            ).distinct().annotate(
                distance=CosineDistance('embedding', query_vector)
            ).order_by('distance')[:3]

            print(f"[DEBUG] Found {suspect_clients.count()} suspect clients")

            for client in suspect_clients:
                sim_score = round((1 - client.distance) * 100, 2)
                print(f" -> {client.user_fullName} | Distance: {client.distance:.4f} | Similarity: {sim_score}%")

            if suspect_clients.exists():
                top_match = suspect_clients.first()
                print(f"[DEBUG] Top match: {top_match.user_fullName}")
                print(f"[DEBUG] Distance: {top_match.distance}")

                if top_match.distance < 0.30:
                    print("[DEBUG] ⚠️ COI FLAG TRIGGERED")
                    self.is_coi_flagged = True
                    note = ""
                    for client in suspect_clients:
                        if client.distance < 0.40:
                            sim_score = round((1 - client.distance) * 100, 2)
                            note += f"- {client.user_fullName} | Địa chỉ: {client.user_address} (Giống {sim_score}%)\n"

                    self.coi_note = note
                    print("[DEBUG] COI NOTE:\n" + note)
                else:
                    print("[DEBUG] Không đủ độ giống để bật cờ")
            else:
                print("[DEBUG] Không tìm thấy suspect client nào trong DB thỏa điều kiện.")

        print("========== [DEBUG COI CHECK END] ==========\n")
        super(LegalCase, self).save(*args, **kwargs)


    def __str__(self):
            lawyer_name = self.assigned_lawyer.user_name if self.assigned_lawyer else "Chưa phân công LS"
            return f"{self.title} - LS: {lawyer_name}"
    
    @property
    def overall_progress(self):
        steps = self.progress_steps.all()
        total = steps.count()
        if total == 0: return 0
        completed = steps.filter(is_completed=True).count()
        return int((completed / total) * 100)

class CaseProgressStep(models.Model):
    case = models.ForeignKey(
        LegalCase, 
        on_delete=models.CASCADE, 
        related_name='progress_steps',
        verbose_name="Vụ việc"
    )
    create_by = models.ForeignKey(
    Users,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    verbose_name="Người tạo",
    related_name="steps_created"
    )
    updated_by = models.ForeignKey(
    Users,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    verbose_name="Người cập nhật",
    related_name="steps_update"
    )
    step_order = models.PositiveIntegerField(verbose_name="Thứ tự bước")
    title = models.CharField(max_length=255, verbose_name="Tên bước (Thỏa thuận)")
    deadline = models.DateTimeField(verbose_name="Hạn chót")
    is_completed = models.BooleanField(default=False, verbose_name="Đã hoàn thành?")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Ngày xong thực tế")

    class Meta:
        ordering = ['step_order']
        verbose_name = "Tiến độ bước"
        verbose_name_plural = "Tiến độ các bước"

    def __str__(self):
        status = "" if self.is_completed else ""
        return f"{status} Bước {self.step_order}: {self.title}"
    def save(self, *args, **kwargs):
        print("SELF:", self)
        print("DICT:", self.__dict__)
        is_newly_completed = False
        
        if self.pk:
            old_step = CaseProgressStep.objects.get(pk=self.pk)
            if self.is_completed and not old_step.is_completed:
                is_newly_completed = True

        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
            
        elif not self.is_completed:
            self.completed_at = None
            
        super().save(*args, **kwargs)    

        if is_newly_completed:
            CaseLog.objects.create(
                legal_case=self.case,
                created_by=self.updated_by,
                action=f"Đã hoàn thành bước: {self.title}",
                note="Hệ thống tự động ghi nhận theo tiến độ.",
                date_occurred=self.completed_at or timezone.now(),
                stage=CaseStage.PROCESSING if hasattr(CaseStage, 'PROCESSING') else CaseStage.CONSULTING
            )

DOCUMENT_STATUS = [
    ('DRAFT', 'Bản nháp'),
    ('PENDING', 'Chờ duyệt'), 
    ('FINAL', 'Chính thức'), 
    ('REJECTED', 'Cần chỉnh sửa') 
]

class Document(models.Model):
    legal_case = models.ForeignKey(
        LegalCase,
        on_delete=models.CASCADE,
        related_name='documents', 
        verbose_name="Thuộc vụ việc"
    )
    document_name = models.CharField(max_length=255, null=False, verbose_name="Tên tài liệu")
    file = models.FileField(upload_to='documents/%Y/%m/', verbose_name="File đính kèm")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    upload_by = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Người upload"
    )
    status = models.CharField(
        max_length=20, 
        choices=DOCUMENT_STATUS, 
        default='DRAFT',
        verbose_name="Trạng thái tài liệu"
    )
    approved_by = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_documents',
        verbose_name="Người duyệt (Luật sư)"
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name="Thời gian duyệt")
    def __str__(self):
        return self.document_name


CONTRACT_STATUS = [
    ('DRAFT', 'Dự thảo'),
    ('SIGNED', 'Đã ký'),
    ('LIQUIDATED', 'Đã thanh lý'),
    ('CANCEL_REQUESTED', 'Yêu cầu hủy'),
    ('CANCELLED', 'Đã hủy')
]

class Contract(models.Model):
    legal_case = models.ForeignKey(
        LegalCase, 
        on_delete=models.CASCADE, 
        related_name='contracts', 
        verbose_name="Thuộc vụ việc"
    )
    assigned_lawyer = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cases_assigned_lawyer",
        verbose_name="Luật sư phụ trách"
    )
    assigned_legal_assistant = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_legal_assistant",
        verbose_name="trợ lý luật sư phụ trách"
    )
    contract_number = models.CharField(max_length=8, unique=True, verbose_name="Số hợp đồng")
    content = models.TextField(verbose_name="Nội dung điều khoản")
    signed_file = models.FileField(
        upload_to='contracts/', 
        null=True, blank=True, 
        verbose_name="File đã ký"
    )
    signed_date = models.DateField(blank=True, null=True, verbose_name="Ngày ký hợp đồng")
    total_value = models.DecimalField(
        max_digits=15, 
        decimal_places=0, 
        verbose_name="Giá trị hợp đồng"
    )
    status = models.CharField(max_length=20, choices=CONTRACT_STATUS, default='DRAFT')
    is_deleted = models.BooleanField(default=False, verbose_name="Đã xóa tạm thời")
    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()
    def __str__(self):
        return f"Contract: {self.contract_number}"
    @property
    def is_fully_paid(self):
        total_paid = self.payments.aggregate(models.Sum('amount'))['amount__sum'] or 0
        return total_paid >= self.total_value

    @property
    def remaining_amount(self):
        total_paid = self.payments.aggregate(models.Sum('amount'))['amount__sum'] or 0
        return self.total_value - total_paid

class Feedback(models.Model):
    client = models.ForeignKey(Users, on_delete=models.CASCADE, verbose_name="Khách hàng")
    lawyer = models.ForeignKey(
        Users, on_delete=models.CASCADE, 
        related_name='feedbacks_received', 
        verbose_name="Đánh giá Luật sư"
    )
    rating = models.IntegerField(default=5, verbose_name="Điểm (1-5)")
    comment = models.TextField(verbose_name="Nhận xét")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.user_name} rated {self.rating} stars"

class Payment(models.Model):
    contract = models.ForeignKey(
        Contract, 
        on_delete=models.CASCADE, 
        related_name='payments', 
        verbose_name="Thuộc hợp đồng"
    )
    amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="Số tiền")
    note = models.CharField(max_length=255, verbose_name="Ghi chú")
    payment_date = models.DateTimeField(auto_now_add=True)
    receipt_image = models.FileField(
        upload_to='payments/', 
        null=True, blank=True, 
        verbose_name="Ảnh biên lai"
    )

    def __str__(self):
        return f"{self.amount} - {self.payment_date}"

APPOINTMENT_STATUS = [
    ('PENDING', 'Chờ xác nhận'),
    ('CONFIRMED', 'Đã xác nhận'),
    ('COMPLETED', 'Đã xong'),
    ('CANCELLED', 'Đã hủy'),
]

ATTENDEE_STATUS = [
    ('PENDING', 'Chờ trả lời'),
    ('ACCEPTED', 'Chấp nhận'),
    ('DECLINED', 'Từ chối'),
    ('TENTATIVE', 'Có thể tham gia'),
]

class Appointment(models.Model):
    title = models.CharField(max_length=255, verbose_name="Tiêu đề cuộc hẹn/họp")
    
    creator = models.ForeignKey(
        Users, 
        on_delete=models.CASCADE, 
        related_name='created_appointments',
        verbose_name="Người tạo"
    )

    attendees = models.ManyToManyField(
        Users, 
        through='AppointmentAttendee', 
        related_name='appointments',
        verbose_name="Người tham gia"
    )

    legal_case = models.ForeignKey(
        LegalCase, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='appointments',
        verbose_name="Vụ việc liên quan (nếu có)"
    )

    date_time = models.DateTimeField(verbose_name="Thời gian")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="Thời gian kết thúc")
    location = models.CharField(max_length=255, default="Tại văn phòng", verbose_name="Địa điểm")
    note = models.TextField(blank=True, verbose_name="Ghi chú/Nội dung")
    
    status = models.CharField(
        max_length=20, 
        choices=APPOINTMENT_STATUS, 
        default='PENDING',
        verbose_name="Trạng thái"
    )

    def __str__(self):
        return f"{self.title} - {self.date_time.strftime('%d/%m/%Y %H:%M')}"   
    
class AppointmentAttendee(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    
    status = models.CharField(
        max_length=20, 
        choices=ATTENDEE_STATUS, 
        default='PENDING',
        verbose_name="Trạng thái xác nhận"
    )
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('appointment', 'user')
    
TASK_PRIORITY = [
    ('LOW', 'Thấp'),
    ('MEDIUM', 'Trung bình'),
    ('HIGH', 'Cao'),
    ('URGENT', 'Khẩn cấp'),
]
TASK_STATUS = [
    ('TODO', 'Cần làm'),
    ('IN_PROGRESS', 'Đang làm'),
    ('DONE', 'Hoàn thành'),
]

class Task(models.Model):
    legal_case = models.ForeignKey(LegalCase, on_delete=models.CASCADE, related_name='tasks', verbose_name="Thuộc vụ việc")
    creator = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='tasks_created')
    assignee = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, related_name='tasks_assigned', verbose_name="Người thực hiện")
    title = models.CharField(max_length=255, verbose_name="Tên công việc")
    description = models.TextField(blank=True, verbose_name="Mô tả chi tiết")
    deadline = models.DateTimeField(verbose_name="Hạn chót")
    priority = models.CharField(max_length=20, choices=TASK_PRIORITY, default='MEDIUM')
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='TODO')

    def __str__(self):
        return self.title
class CaseLog(models.Model):
    legal_case = models.ForeignKey(LegalCase, on_delete=models.CASCADE, related_name='logs', verbose_name="Vụ việc")
    created_by = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True)
    
    action = models.CharField(max_length=255, verbose_name="Hành động (VD: Đã nộp đơn lên tòa)")
    note = models.TextField(blank=True, verbose_name="Ghi chú thêm")
    date_occurred = models.DateTimeField(verbose_name="Thời gian diễn ra")
    stage = models.CharField(
        max_length=50, 
        choices=CaseStage.choices,
        default=CaseStage.CONSULTING,
        verbose_name="Thuộc giai đoạn"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.legal_case.title} - {self.action}"
    


@receiver(post_save, sender=Users)
def auto_generate_user_vector(sender, instance, created, **kwargs):
    if instance.user_fullName and instance.user_address:
        text_to_embed = f"{instance.user_fullName} - {instance.user_address}"
        vector = embed_model.encode(text_to_embed).tolist()
        Users.objects.filter(pk=instance.pk).update(embedding=vector)
        
        print(f"✅ Đã tạo Vector AI thành công cho: {instance.user_fullName}")

class LawReference(models.Model):
    law_name = models.CharField(
        max_length=255, 
        unique=True, 
        verbose_name="Tên bộ luật"
    )
    category = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True, verbose_name="Mô tả tóm tắt")
    file_path = models.CharField(max_length=500, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    effective_date = models.DateField(null=True, blank=True, verbose_name="Ngày có hiệu lực")
    is_active = models.BooleanField(default=True, verbose_name="Còn hiệu lực")
    def __str__(self):
        return self.law_name

    class Meta:
        verbose_name = "Danh mục văn bản luật"
        verbose_name_plural = "Danh mục văn bản luật"

class LegalKnowledgeChunk(models.Model):
    law_reference = models.ForeignKey(
        LawReference, 
        on_delete=models.CASCADE, 
        related_name='chunks'
    )
    title = models.CharField(max_length=255, verbose_name="Tiêu đề điều luật")
    content = models.TextField(verbose_name="Nội dung chi tiết")
    
    embedding = VectorField(dimensions=384, verbose_name="Vector nội dung")

    def __str__(self):
        return f"{self.law_reference.law_name} - {self.title}"

    class Meta:
        verbose_name = "Dữ liệu tri thức luật"
        verbose_name_plural = "Dữ liệu tri thức luật"
        indexes = [
            HnswIndex(
                name='idx_legal_vector',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops'] 
            )
        ]

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=AppointmentAttendee)
def handle_appointment_status_update(sender, instance, **kwargs):
    appointment = instance.appointment
    
    print(f"--- [DEBUG] Signal triggered for Appointment: {appointment.title} ---")
    print(f"--- [DEBUG] Attendee {instance.user.user_name} status: {instance.status} ---")

    if appointment.status == 'PENDING':
        attendees = AppointmentAttendee.objects.filter(appointment=appointment)
        total_attendees = attendees.count()
        
        accepted_count = attendees.filter(status='ACCEPTED').count()
        declined_count = attendees.filter(status='DECLINED').count()

        print(f"--- [DEBUG] Total: {total_attendees} | Accepted: {accepted_count} | Declined: {declined_count}")

        if declined_count > 0:
            appointment.status = 'CANCELLED'
            appointment.save()
            print("--- [DEBUG] Status changed to CANCELLED")
            
        elif total_attendees > 0 and accepted_count == total_attendees:
            appointment.status = 'CONFIRMED'
            appointment.save()
            print("--- [DEBUG] Status changed to CONFIRMED")

class ChatMessage(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, blank=True, null=True, verbose_name="Người dùng")
    session_key = models.CharField(max_length=100, db_index=True, verbose_name="Mã phiên (Session)")
    role = models.CharField(max_length=10, verbose_name="Vai trò") 
    content = models.TextField(verbose_name="Nội dung tin nhắn")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian gửi")

    class Meta:
        ordering = ['created_at']
        verbose_name = "Tin nhắn Chat AI"
        verbose_name_plural = "Quản lý tin nhắn Chat AI"