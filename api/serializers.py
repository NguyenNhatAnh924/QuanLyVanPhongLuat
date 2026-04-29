from rest_framework import serializers
from .models import (
    Users, StaffProfile, LegalCase, Document, Contract, Payment, 
    Feedback, Appointment, Task, CaseLog, ServicePackage, 
    AppointmentAttendee, LawReference, LegalKnowledgeChunk, CaseProgressStep, ChatMessage
)
from django.db.models import Q
from django.utils import timezone

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['user_id', 'user_fullName', 'user_email', 'user_phone', 'user_avatar', 'user_role', 'is_active']

class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['specialization', 'license_number', 'experience_years', 'bio', 'date_joined']

class UsersSerializer(serializers.ModelSerializer):
    staff_profile = StaffProfileSerializer(read_only=True)
    class Meta:
        model = Users
        fields = [
                'user_id', 'user_fullName', 'user_email', 'password', 'user_name', 
                'user_phone', 'user_address', 'user_role', 'user_avatar', 'staff_profile', 
                'is_active', 'user_status'
            ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance


class PaymentSerializer(serializers.ModelSerializer):
    payment_date_display = serializers.DateTimeField(source='payment_date', format="%d/%m/%Y %H:%M", read_only=True)
    class Meta:
        model = Payment
        fields = '__all__'

class CaseLogSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = CaseLog
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.created_by:
            response['created_by'] = UserBasicSerializer(instance.created_by).data
        return response

class ContractSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_paid = serializers.SerializerMethodField()
    remaining_balance = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = '__all__'

    def to_representation(self, instance):
        response = super().to_representation(instance)

        if instance.assigned_lawyer:
            response['assigned_lawyer'] = UserBasicSerializer(instance.assigned_lawyer).data
        if instance.assigned_legal_assistant:
            response['assistant'] = UserBasicSerializer(instance.assigned_legal_assistant).data
        else:
            response['assistant'] = None
        
        if instance.legal_case:
            response['case_title'] = instance.legal_case.title
            if instance.legal_case.client:
                response['client'] = UserBasicSerializer(instance.legal_case.client).data

        return response
    
    def get_total_paid(self, obj):
        from django.db.models import Sum
        result = obj.payments.aggregate(Sum('amount'))['amount__sum']
        return result or 0

    def get_remaining_balance(self, obj):
        return obj.total_value - self.get_total_paid(obj)

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['upload_by', 'uploaded_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.upload_by:
            response['upload_by'] = UserBasicSerializer(instance.upload_by).data
        return response

class AttendeeSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True) 

    class Meta:
        model = AppointmentAttendee
        fields = ['user', 'status', 'updated_at']

class AppointmentSerializer(serializers.ModelSerializer):
    case_title = serializers.CharField(source='legal_case.title', read_only=True)
    creator_info = UserBasicSerializer(source='creator', read_only=True) 
    attendee_details = AttendeeSerializer(source='appointmentattendee_set', many=True, read_only=True)
    attendees = serializers.PrimaryKeyRelatedField(
        queryset=Users.objects.all(), 
        many=True
    )
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['creator']

    def create(self, validated_data):
        attendees_data = validated_data.pop('attendees', [])
        appointment = Appointment.objects.create(**validated_data)
        for user in attendees_data:
            AppointmentAttendee.objects.create(
                appointment=appointment, 
                user=user,
                status='PENDING'
            )
        return appointment

    def update(self, instance, validated_data):
        attendees_data = validated_data.pop('attendees', None)
        instance = super().update(instance, validated_data)

        if attendees_data is not None:
            instance.appointmentattendee_set.all().delete()
            for user in attendees_data:
                AppointmentAttendee.objects.create(appointment=instance, user=user)
        return instance

    def validate(self, data):
        start_time = data.get('date_time', self.instance.date_time if self.instance else None)
        end_time = data.get('end_time', self.instance.end_time if self.instance else None)
        
        request_user = self.context['request'].user
        attendees = data.get('attendees', [])
        
        check_user_ids = [u.user_id for u in attendees]
        check_user_ids.append(request_user.user_id)
        check_user_ids = list(set(check_user_ids))

        overlap = Appointment.objects.filter(
            Q(creator_id__in=check_user_ids) | Q(attendees__pk__in=check_user_ids),
            status__in=['PENDING', 'CONFIRMED'],
            date_time__lt=end_time,
            end_time__gt=start_time
        ).distinct() 

        if self.instance:
            overlap = overlap.exclude(pk=self.instance.pk)

        if overlap.exists():
            conflicting = overlap.first()
            raise serializers.ValidationError(
                f"Bị trùng lịch với cuộc hẹn '{conflicting.title}' ({conflicting.date_time.strftime('%H:%M')} - {conflicting.end_time.strftime('%H:%M')})"
            )

        return data

class TaskSerializer(serializers.ModelSerializer):
    legal_case_title = serializers.ReadOnlyField(source='legal_case.title')
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['creator', 'created_at']

    def get_legal_case_title(self, obj):
        if obj.legal_case:
            return obj.legal_case.title
        return None
    
    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.creator:
            response['creator'] = UserBasicSerializer(instance.creator).data
        if instance.assignee:
            response['assignee'] = UserBasicSerializer(instance.assignee).data
        return response

class CaseProgressStepSerializer(serializers.ModelSerializer):
    deadline_display = serializers.DateTimeField(
        source='deadline', 
        format="%d/%m/%Y %H:%M", 
        read_only=True
    )
    completed_at_display = serializers.DateTimeField(
        source='completed_at',
        format="%d/%m/%Y %H:%M",
        read_only=True
    )

    class Meta:
        model = CaseProgressStep
        fields = '__all__'
        read_only_fields = ['completed_at']

    def validate(self, data):
        deadline = data.get('deadline')
        if deadline and deadline < timezone.now():
            raise serializers.ValidationError("Deadline phải lớn hơn thời điểm hiện tại.")
        return data

class LegalCaseSerializer(serializers.ModelSerializer):
    contracts = ContractSerializer(many=True, read_only=True)
    progress_steps = CaseProgressStepSerializer(many=True, read_only=True)
    logs = CaseLogSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    appointments = AppointmentSerializer(many=True, read_only=True)
    overall_progress = serializers.ReadOnlyField()
    goal_status_display = serializers.CharField(source='get_goal_achievement_status_display', read_only=True)
    class Meta:
        model = LegalCase
        fields = '__all__'
        read_only_fields = [
            'client', 'created_at', 'status', 
            'verified_at', 'verified_by', 'goal_achievement_status'
        ]

    def to_representation(self, instance):
        response = super().to_representation(instance)
        
        if instance.client:
            response['client'] = UserBasicSerializer(instance.client).data
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.user_role == 0:
                response.pop('tasks', None)

        if hasattr(instance, 'consultant') and instance.consultant:
             response['consultant'] = UserBasicSerializer(instance.consultant).data
             
        if hasattr(instance, 'assigned_lawyer') and instance.assigned_lawyer:
             response['assigned_lawyer'] = UserBasicSerializer(instance.assigned_lawyer).data
             
        if hasattr(instance, 'assistant') and instance.assistant:
             response['assistant'] = UserBasicSerializer(instance.assistant).data

        if hasattr(instance, 'verified_by') and instance.verified_by:
             response['verified_by'] = UserBasicSerializer(instance.verified_by).data

        if instance.service_package:
            response['service_package_info'] = ServicePackageSerializer(instance.service_package).data
        return response

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['client', 'created_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.client:
            response['client'] = UserBasicSerializer(instance.client).data
        return response

class ServicePackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePackage
        fields = '__all__'

class LawReferenceSerializer(serializers.ModelSerializer):
    chunk_count = serializers.IntegerField(source='chunks.count', read_only=True)
    
    class Meta:
        model = LawReference
        fields = [
            'id', 'law_name', 'category', 'description', 
            'file_path', 'effective_date', 'is_active', 
            'updated_at', 'created_at', 'chunk_count'
        ]

class LegalKnowledgeChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalKnowledgeChunk
        fields = ['id', 'law_reference', 'title', 'content', 'embedding']
        extra_kwargs = {
            'embedding': {'write_only': True} 
        }

class ChatMessageSerializer(serializers.ModelSerializer):
    created_at_display = serializers.DateTimeField(
        source='created_at', 
        format="%d/%m/%Y %H:%M", 
        read_only=True
    )

    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'session_key', 'role', 'content', 'created_at', 'created_at_display']
        read_only_fields = ['created_at']

    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.user:
            response['user_info'] = {
                'fullName': instance.user.user_fullName,
                'avatar': instance.user.user_avatar.url if instance.user.user_avatar else None
            }
        return response