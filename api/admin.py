
from django.contrib import admin
from .models import (
    Users, StaffProfile, LegalCase, Document, Contract, Payment, Feedback,
    Appointment, Task, CaseLog, ServicePackage, AppointmentAttendee,
    LawReference, LegalKnowledgeChunk, ChatMessage
)

@admin.register(AppointmentAttendee)
class AppointmentAttendeeAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'user', 'status', 'updated_at']
    list_filter = ['status', 'updated_at']
    search_fields = ['appointment__title', 'user__user_fullName', 'user__user_name']

class AppointmentAttendeeInline(admin.TabularInline):
    model = AppointmentAttendee
    extra = 1

#Bang Users
@admin.register(Users)
class UserAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Users._meta.fields if field.name != 'embedding']
    exclude = ('embedding',)
    search_fields = ('user_name', 'user_email')
    ordering = ('-user_id',)

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = [field.name for field in StaffProfile._meta.fields]
    def get_full_name(self, obj):
        return obj.user.user_fullName
    get_full_name.short_description = 'Họ và tên'

@admin.register(LegalCase)
class LegalCaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'consultant', 'assigned_lawyer', 'assistant', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'client__user_name']
    readonly_fields = ('created_at',)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'legal_case', 'uploaded_at']

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['id','contract_number', 'legal_case', 'assigned_lawyer', 'status', 'total_value']
    list_filter = ['status']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['contract', 'amount', 'payment_date']

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['client', 'lawyer', 'rating']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    # Thêm inline vào đây
    inlines = [AppointmentAttendeeInline]
    
    list_display = ['id', 'title', 'creator', 'display_attendees_status', 'date_time', 'status', 'location']
    list_filter = ['status', 'date_time']
    search_fields = ['creator__user_name', 'title', 'note']

    def display_attendees_status(self, obj):
        attendees = AppointmentAttendee.objects.filter(appointment=obj)
        return ", ".join([f"{a.user.user_name} ({a.get_status_display()})" for a in attendees])
    
    display_attendees_status.short_description = 'Chi tiết người tham gia'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'creator', 'assignee', 'priority', 'status', 'deadline']
    list_filter = ['priority', 'status', 'deadline']
    search_fields = ['title', 'description', 'assignee__user_name']

@admin.register(CaseLog)
class CaseLogAdmin(admin.ModelAdmin):
    list_display = ['legal_case', 'action', 'created_by', 'date_occurred']
    list_filter = ['date_occurred']
    search_fields = ['legal_case__title', 'action', 'note']

@admin.register(ServicePackage)
class ServicePackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description'] 

class LegalKnowledgeChunkInline(admin.TabularInline):

    model = LegalKnowledgeChunk
    extra = 1

    exclude = ('embedding',)

@admin.register(LawReference)
class LawReferenceAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'law_name',
        'category',
        'updated_at'
    ]

    search_fields = [
        'law_name',
        'category'
    ]

    list_filter = [
        'category'
    ]
    inlines = [LegalKnowledgeChunkInline]

@admin.register(LegalKnowledgeChunk)
class LegalKnowledgeChunkAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'law_reference',
        'title'
    ]

    search_fields = [
        'title',
        'content'
    ]

    list_filter = [
        'law_reference'
    ]

    exclude = ('embedding',)

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):

    list_display = ['id', 'user', 'session_key', 'role', 'content_summary', 'created_at']
    
    list_filter = ['role', 'created_at']
    
    search_fields = ['content', 'user__user_name', 'session_key']
    
    ordering = ('-created_at',)

    def content_summary(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_summary.short_description = 'Nội dung'