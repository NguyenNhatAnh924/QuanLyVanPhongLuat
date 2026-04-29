# Django
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
import threading
from django.core.mail import send_mail

# Django REST Framework
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

# JWT
from rest_framework_simplejwt.tokens import RefreshToken

# Python
from datetime import datetime, timedelta
from django.utils import timezone 
import json

# AI
from groq import Groq

# Vector
from pgvector.django import CosineDistance

# Local imports
from .models import (
    Users, LegalCase, Document, Contract, Payment, Feedback,
    Appointment, Task, CaseLog, ServicePackage, CaseStage, LawReference, LegalKnowledgeChunk,CaseProgressStep, ChatMessage,
    ROLE, embed_model
)

from .serializers import (
    UsersSerializer, LegalCaseSerializer, DocumentSerializer,
    ContractSerializer, PaymentSerializer, FeedbackSerializer,
    AppointmentSerializer, TaskSerializer, CaseLogSerializer,ChatMessageSerializer,
    ServicePackageSerializer, AppointmentAttendee, LawReferenceSerializer, CaseProgressStepSerializer
)


from dotenv import load_dotenv
import os
from decimal import Decimal, InvalidOperation
from .vnpay import vnpay
VNP_TMN_CODE = 'YYLO3HA8'
VNP_HASH_SECRET = 'G13GBZLODUTD9XXBRRPVZ8B4CZM3M4KO'.strip()
VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
VNP_RETURN_URL = 'http://127.0.0.1:8000/api/vnpay_return/'

# 9704198526191432198
# NGUYEN VAN A
# 07/15
# 123456
@api_view(['POST'])
def create_vnpay_payment(request):
    contract_id = request.data.get('contract_id')
    payment_type = request.data.get('payment_type', 'PARTIAL')
    input_amount = request.data.get('amount')
    try:
        contract = Contract.objects.get(id=contract_id)
        
        if payment_type == 'FULL':
            amount = contract.total_value
        elif payment_type == 'REMAINING':
            amount = contract.remaining_amount 
        elif payment_type == 'PARTIAL':
            amount = contract.total_value * Decimal('0.5')
        elif payment_type == 'CUSTOM':

            if not input_amount:
                return Response({"error": "Vui lòng nhập số tiền muốn thanh toán"}, status=400)
            try:
                amount = Decimal(str(input_amount))
            except (ValueError, TypeError, InvalidOperation):
                return Response({"error": "Số tiền nhập không hợp lệ"}, status=400)
        else:
            return Response({"error": "Hình thức thanh toán không hợp lệ"}, status=400)
 
        if amount < 5000:
            return Response({"error": "Số tiền tối thiểu thanh toán là 5,000 VND"}, status=400)
            
        if amount > contract.remaining_amount:
            return Response({
                "error": f"Số tiền không được vượt quá dư nợ ({contract.remaining_amount:,.0f} VND)"
            }, status=400)

    except Contract.DoesNotExist:
        return Response({"error": "Hợp đồng không tồn tại"}, status=404)

    vnp = vnpay()
    
    vnp.requestData['vnp_Version'] = '2.1.0'
    vnp.requestData['vnp_Command'] = 'pay'
    vnp.requestData['vnp_TmnCode'] = VNP_TMN_CODE
    vnp.requestData['vnp_Amount'] = int(amount) # Nhân 100 theo quy định VNPay
    vnp.requestData['vnp_CurrCode'] = 'VND'
    vnp.requestData['vnp_TxnRef'] = f"{contract.id}_{int(datetime.now().timestamp())}"
    
    vnp.requestData['vnp_OrderInfo'] = f"ThanhToan_HD_{contract.id}"
    vnp.requestData['vnp_OrderType'] = 'billpayment'
    vnp.requestData['vnp_Locale'] = 'vn'
    
    vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
    
    vnp.requestData['vnp_IpAddr'] = '127.0.0.1' 
    vnp.requestData['vnp_ReturnUrl'] = VNP_RETURN_URL

    payment_url = vnp.get_payment_url(VNP_URL, VNP_HASH_SECRET)
    
    return Response({"payment_url": payment_url})

@api_view(['GET'])
@permission_classes([AllowAny])
def vnpay_return(request):
    vnp = vnpay()
    vnp.responseData = request.GET.dict()
    
    MY_ACCOUNT_URL = "http://localhost:5173/my_account"
    
    if vnp.validate_response(VNP_HASH_SECRET):
        res_code = vnp.responseData.get('vnp_ResponseCode')
        txn_ref = vnp.responseData.get('vnp_TxnRef')
        transaction_no = vnp.responseData.get('vnp_TransactionNo')
        
        if res_code == '00':
            print(f"--- ĐANG XỬ LÝ LƯU ĐƠN HÀNG: {txn_ref} ---")
            parts = txn_ref.split('_')
            contract_id = parts[0]
            
            try:
                contract = Contract.objects.get(id=contract_id)
                
                if not Payment.objects.filter(note__contains=transaction_no).exists():
                    amount = int(vnp.responseData.get('vnp_Amount')) / 100
                    Payment.objects.create(
                        contract=contract,
                        amount=amount,
                        note=f"Thanh toán VNPAY - {parts[1]}. Mã GD: {transaction_no}"
                    )
                    print("--- ĐÃ TẠO LỊCH SỬ PAYMENT ---")
                
                if contract.status != 'SIGNED' or not contract.signed_date:
                    contract.status = 'SIGNED'
                    contract.signed_date = timezone.now().date()
                    contract.save()
                    
                    legal_case = contract.legal_case
                    legal_case.status = 'CONFIRMED'
                    legal_case.save()
                    print("--- ĐÃ CẬP NHẬT HỢP ĐỒNG VÀ VỤ VIỆC ---")

                return redirect(f"{MY_ACCOUNT_URL}?payment=success&msg=Thanh toán thành công!")
                
            except Exception as e:
                print(f"--- LỖI KHI LƯU: {str(e)} ---")
                return redirect(f"{MY_ACCOUNT_URL}?payment=error&msg=Lỗi hệ thống khi lưu dữ liệu")
                
        else:
            print(f"--- THANH TOÁN THẤT BẠI: Mã {res_code} ---")
            return redirect(f"{MY_ACCOUNT_URL}?payment=failed&msg=Giao dịch không thành công hoặc đã bị hủy")
        
    return redirect(f"{MY_ACCOUNT_URL}?payment=error&msg=Chữ ký không hợp lệ")

class UsersViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all().order_by('-user_id')
    serializer_class = UsersSerializer

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        user_name = request.data.get('user_name')
        email = request.data.get('email')
        password = request.data.get('password')

        if not user_name or not password:
            return Response(
                {'error': 'user_name hoặc mật khẩu rỗng.'},
                 status=status.HTTP_400_BAD_REQUEST
            )        
        user = authenticate(username=user_name, password=password)
        
        if user is None:
            return Response(
                {'error': 'Tên đăng nhập hoặc mật khẩu không đúng.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
             return Response(
                 {'error': 'Tài khoản này đã bị khóa.'}, 
                 status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'message': 'Đăng nhập thành công',
                'user': UsersSerializer(user).data,
                'token': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        data = request.data.copy()
        data['user_role'] = 0
        serializer = UsersSerializer(data = data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Đăng ký thành công'},
                status= status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status = status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def is_login(self, request):
        return Response(
            {"user": UsersSerializer(request.user).data}
        )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_staff(self, request):  
        if request.user.user_role != 4:
             return Response(
                 {'error': 'Bạn không đủ quyền hạn (Chỉ dành cho Quản lý).'},
                 status=status.HTTP_403_FORBIDDEN
             )   
        data = request.data.copy()
        new_user_role= data.get('user_role', 1)
        try:
            new_user_role = int(new_user_role)
            if new_user_role not in [0, 1, 2, 3, 4]: 
                raise ValueError()
        except:
            return Response(
                {'error': 'Quyền hạn không họp lệ.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data['user_role'] = new_user_role
     
        serializer = UsersSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Tạo nhân viên thành công.',
                    'staff': serializer.data
                 },
                 status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def lawyers(self, request):
        lawyers = Users.objects.filter(user_role=3, is_active=True)
        serializer = UsersSerializer(lawyers, many=True)
        return Response({"lawyers": serializer.data})

    @action(detail=False, methods=['get'])
    def assistants(self, request):
        assistants = Users.objects.filter(user_role=2, is_active=True)
        serializer = UsersSerializer(assistants, many=True)
        return Response({"assistants": serializer.data})  
      
    @action(detail=False, methods=['get'], permission_classes= [AllowAny])
    def staff_list(self, request):
        staff = Users.objects.filter(user_role__in=[1, 2, 3, 4]).select_related('staff_profile')
        serializer = UsersSerializer(staff, many=True)

        return Response(
            {
                "message": "Danh sách nhân viên",
                "staff_list" : serializer.data,
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        user = request.user
        data = request.data.copy()
        forbidden_fields = ['user_role', 'is_staff', 'is_superuser', 'is_active', 'password', 'user_email', 'user_name']
        for field in forbidden_fields:
            if field in data:
                data.pop(field)
        serializer = UsersSerializer(user, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Cập nhật thông tin thành công.',
                    'user': serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LegalCaseViewSet(viewsets.ModelViewSet):
    serializer_class = LegalCaseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user, status='PROCESSING')

    def get_queryset(self):
        user = self.request.user
        role = user.user_role
        queryset = LegalCase.objects.select_related('client', 'consultant').prefetch_related(
            'contracts', 
            'documents', 
            'logs', 
            'tasks',        
            'appointments' 
        )

        if role == 0:
            return queryset.filter(client=user).order_by('-created_at')

        if role == 1:
            return queryset.all().order_by('-created_at')

        if role in [2, 3]:
            return queryset.filter(
                Q(assigned_lawyer=user) | 
                Q(assistant=user),
                status='CONFIRMED'
            ).order_by('-created_at')
        if role == 4:
            return queryset.all().order_by('-created_at')
            
        return queryset.none()
    
    @action(detail=True, methods=['patch'])
    def assign_staff(self, request, pk=None):
        """Action dành cho Quản lý để chia vai trò"""
        if request.user.user_role != 4:
            return Response({"error": "Chỉ quản lý mới được phân công"}, status=403)
        
        case = self.get_object()
        case.consultant_id = request.data.get('consultant_id', case.consultant_id)
        case.assigned_lawyer_id = request.data.get('lawyer_id', case.assigned_lawyer_id)
        case.assistant_id = request.data.get('assistant_id', case.assistant_id)
        case.save()
        return Response({"message": "Phân công nhân sự thành công"})
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.user_role == 0:
            return Response(
                {"error": "Yêu cầu đã được xác nhận vui lòng liên hệ luật sư phụ trách."},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.user.user_role == 2:
            request.data['consultant'] = request.user.user_id

        return super().update(request, *args, **kwargs)
    @action(detail=True, methods=['patch'])
    def accept_case(self, request, pk=None):
        case = self.get_object()
        if request.user.user_role == 0:
            return Response(
                {"error": "Khách hàng không được thực hiện thao tác này."},
                status=status.HTTP_403_FORBIDDEN
            )
        case.assigned_staff = request.user
        case.status = 'PROCESSING'
        case.save()
        return Response(
            {
                "message": "Yêu cầu được tiếp nhận",
                "data": LegalCaseSerializer(case).data
            },
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['patch'])
    def confirm_case(self, request, pk=None):
        case = self.get_object()
        if request.user.user_role == 0:
            return Response(
                {"error": "Khách hàng không được thực hiện thao tác này."},
                status=status.HTTP_403_FORBIDDEN
            )
        case.assigned_staff = request.user
        case.status = 'CONFIRMED'
        case.save()
        return Response(
            {
                "message": "Yêu cầu được tiếp nhận",
                "data": LegalCaseSerializer(case).data
            },
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['patch'])
    def reject_case(self, request, pk=None):
        case = self.get_object()
        if request.user.user_role == 0:
            return Response(
                {"error": "Khách hàng không được thực hiện thao tác này."},
                status=status.HTTP_403_FORBIDDEN
            )
        case.assigned_staff = request.user
        case.status = 'REJECTED'
        case.save()
        return Response(
            {
                "message": "Yêu cầu được từ chối.",
                "data": LegalCaseSerializer(case).data
            },
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['patch'])
    def cancel_case(self, request, pk=None):
        case = self.get_object()
        if request.user.user_role != 0:
            return Response(
                {"error": "Nhân viên không được thực hiện thao tác này."},
                status=status.HTTP_403_FORBIDDEN
            )
        case.assigned_staff = None
        case.status = 'CANCELLED'
        case.save()
        return Response(
            {
                "message": "Yêu cầu được từ chối.",
                "data": LegalCaseSerializer(case).data
            },
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['patch'])
    def close_case(self, request, pk=None):
        legal_case = self.get_object()
        legal_case.status = 'LIQUIDATED' 
        legal_case.save()
        return Response({'message': 'Đã đóng vụ việc thành công', 'status': 'LIQUIDATED'})
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def verify_goal_status(self, request, pk=None):
        """
        Action dành riêng cho Tư vấn viên (Role 1) 
        xác nhận khách đạt mục tiêu hay chưa sau khi đóng vụ việc.
        """
        case = self.get_object()
        if case.status != 'LIQUIDATED':
            return Response(
                {"error": "Vụ việc phải ở trạng thái Hoàn thành mới có thể xác nhận kết quả."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        goal_status = request.data.get('goal_achievement_status')
        
        if goal_status not in [1, 2]:
            return Response({"error": "Trạng thái xác nhận không hợp lệ."}, status=400)

        case.goal_achievement_status = goal_status
        case.verified_by = request.user
        case.verified_at = timezone.now()
        case.save()

        return Response({
            "message": "Tư vấn viên đã xác nhận kết quả thành công.",
            "goal_achievement_status": case.goal_achievement_status
        })
    
    @action(detail=False, methods=['get'], url_path='global-identity-check')
    def global_identity_check(self, request):
        search_name = request.query_params.get('name', '').strip()
        
        if not search_name or len(search_name) < 2:
            return Response({"message": "Vui lòng nhập ít nhất 2 ký tự."}, status=400)

        related_cases = LegalCase.objects.filter(
            Q(client__user_fullName__icontains=search_name) | 
            Q(opposing_party_name__icontains=search_name)
        ).select_related('client', 'assigned_lawyer').order_by('-created_at')

        results = []
        for case in related_cases:
            results.append({
                "id": case.id,
                "title": case.title,
                "status": case.status,
                "created_at": case.created_at,
                "description": case.description,
                "client": {
                    "user_fullName": case.client.user_fullName if case.client else "N/A",
                    "user_address": case.client.user_address if case.client else "N/A", 
                    "user_email": case.client.user_email if case.client else "",
                },
                "opposing_party_name": case.opposing_party_name,
                "opposing_party_address": case.opposing_party_address, 
                "assigned_lawyer": {
                    "user_fullName": case.assigned_lawyer.user_fullName if case.assigned_lawyer else "Chưa phân công"
                }
            })
        
        return Response(results)
        
class CaseProgressStepViewSet(viewsets.ModelViewSet):
    """
    Nơi Luật sư lập Timeline hứa hẹn trước khi khách ký hợp đồng
    """
    serializer_class = CaseProgressStepSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        case_id = self.request.query_params.get('legal_case')
        if case_id:
            return CaseProgressStep.objects.filter(case_id=case_id)
        return CaseProgressStep.objects.all()

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super(CaseProgressStepViewSet, self).get_serializer(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        is_many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        if isinstance(serializer.validated_data, list):
            first_step = serializer.validated_data[0]
            case = first_step['case']
            if self.request.user == case.assigned_lawyer or self.request.user.user_role == 4:
                serializer.save(create_by=self.request.user)
            else:
                raise permissions.PermissionDenied("Chỉ Luật sư phụ trách vụ này mới được lập tiến độ.")

        else:
            case = serializer.validated_data['case']
            if self.request.user == case.assigned_lawyer or self.request.user.user_role == 4:
                serializer.save()
            else:
                raise permissions.PermissionDenied("Chỉ Luật sư phụ trách vụ này mới được lập tiến độ.")
                    
    def perform_update(self, serializer):
        case = serializer.instance.case

        if self.request.user == case.assigned_lawyer or getattr(self.request.user, 'user_role', None) == 4:
            serializer.save(updated_by=self.request.user)
        else:
            raise permissions.PermissionDenied("Chỉ Luật sư phụ trách vụ này mới được cập nhật tiến độ.")
        
class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        
        doc_status = 'DRAFT' if user.user_role in [0, 1, 2] else 'FINAL'
        
        serializer.save(upload_by=user, status=doc_status)
    def get_queryset(self):
        user = self.request.user
        role = user.user_role
        if role == 4:
            return Document.objects.all().order_by('-uploaded_at')

        if role == 0:
            return Document.objects.filter(
                Q(legal_case__client=user, status='FINAL') | 
                Q(legal_case__client=user, upload_by=user)
            ).distinct().order_by('-uploaded_at')

        if role in [1, 2, 3]:
            return Document.objects.filter(
                Q(legal_case__consultant=user) | 
                Q(legal_case__assigned_lawyer=user) |
                Q(legal_case__assistant=user) |
                Q(legal_case__contracts__assigned_lawyer=user) |
                Q(legal_case__contracts__assigned_legal_assistant=user) |
                Q(upload_by=user)
            ).distinct().order_by('-uploaded_at')
        return Document.objects.none()
        
class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.user_role == 0:
            return Response({"error": "Khách hàng không được tạo hợp đồng"}, status=403)

        legal_case_id = request.data.get('legal_case')
        try:
            case = LegalCase.objects.get(id=legal_case_id)
            
            if not case.progress_steps.exists():
                return Response({"error": "Vui lòng lập lộ trình tiến độ trước khi tạo hợp đồng."}, status=400)

            data = request.data.copy()
            
            data['assigned_lawyer'] = case.assigned_lawyer_id
            data['assigned_legal_assistant'] = case.assistant_id
            
            if 'contract_number' not in data:
                import uuid
                data['contract_number'] = f"HD-{str(uuid.uuid4())[:5].upper()}"

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except LegalCase.DoesNotExist:
            return Response({"error": "Vụ việc không tồn tại"}, status=404)

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 0:
            return Contract.objects.filter(legal_case__client=user)
        if user.user_role == 4:
            return Contract.objects.all()
        
        return Contract.objects.filter(
            Q(assigned_lawyer=user) | 
            Q(assigned_legal_assistant=user) |
            Q(legal_case__consultant=user)
        ).distinct()
    
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    # LOGIC XEM
    def get_queryset(self):
        user = self.request.user
        role = user.user_role

        if role == 4:
            return Payment.objects.all().order_by('-payment_date')

        if role == 0:
            return Payment.objects.filter(contract__legal_case__client=user).order_by('-payment_date')

        if role in [1, 2, 3]:
            return Payment.objects.filter(
                Q(contract__assigned_lawyer=user) |
                Q(contract__assigned_legal_assistant=user) |
                Q(contract__legal_case__assigned_staff=user)
            ).distinct().order_by('-payment_date')

        return Payment.objects.none()
    

from rest_framework.exceptions import ValidationError

class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        
        if user.user_role in [1, 4]:
            client_id = self.request.data.get('client_id')
            if not client_id:
                raise ValidationError({"client_id": "Bắt buộc phải truyền ID của khách hàng khi nhập hộ."})
            
            try:
                actual_client = Users.objects.get(pk=client_id, user_role=0)
                serializer.save(client=actual_client)
                return
            except Users.DoesNotExist:
                raise ValidationError({"client_id": "Không tìm thấy hồ sơ khách hàng hợp lệ."})

        serializer.save(client=user)

    def get_queryset(self):
        user = self.request.user
        role = user.user_role

        if role == 4:
            return Feedback.objects.all().order_by('-created_at')
        if role == 0:
            return Feedback.objects.filter(client=user).order_by('-created_at')
        if role in [1, 2, 3]:
            return Feedback.objects.filter(lawyer=user).order_by('-created_at')

        return Feedback.objects.none()
    

# --- 6. APPOINTMENT (LỊCH HẸN) ---
def send_appointment_notification_task(appointment):
    """
    Hàm xử lý gửi email thông báo lịch hẹn.
    """
    try:
        # Lấy danh sách email của người tham gia
        emails = list(appointment.attendees.values_list('user_email', flat=True))
        if not emails:
            return

        subject = f"[Thông báo] Lịch hẹn: {appointment.title}"
        message = f"""
        Xin chào,
        Lịch hẹn '{appointment.title}' đã được cập nhật thông tin mới.
        - Thời gian: {appointment.date_time.strftime('%d/%m/%Y %H:%M')}
        - Địa điểm: {appointment.location}
        Vui lòng kiểm tra hệ thống để biết thêm chi tiết.
        """
        
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, emails)
        print(f"✅ Gửi email thành công cho {len(emails)} người.")
    except Exception as e:
        print(f" Lỗi gửi email: {str(e)}")
        
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        with transaction.atomic():
            attendee_ids = self.request.data.get('attendees', [])
            
            appointment = serializer.save(creator=self.request.user)
            user = self.request.user
            
            is_staff_organizer = user.user_role in [1, 4]
            is_included_in_attendees = str(user.user_id) in [str(uid) for uid in attendee_ids]

            if not is_staff_organizer or (is_staff_organizer and is_included_in_attendees):
                from .models import AppointmentAttendee
                AppointmentAttendee.objects.update_or_create(
                    appointment=appointment,
                    user=user,
                    defaults={'status': 'ACCEPTED'}
                )
            
            thread = threading.Thread(target=send_appointment_notification_task, args=(appointment,))
            thread.start()

    def perform_update(self, serializer):
        with transaction.atomic():
            appointment = serializer.save()
            
            from .models import AppointmentAttendee
            creator_attendee = AppointmentAttendee.objects.filter(
                appointment=appointment, 
                user=appointment.creator
            ).first()
            
            if creator_attendee:
                creator_attendee.status = 'ACCEPTED'
                creator_attendee.save()

            thread = threading.Thread(target=send_appointment_notification_task, args=(appointment,))
            thread.start()

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        Appointment.objects.filter(
            status='CONFIRMED',
            end_time__lt=now
        ).update(status='COMPLETED')

        Appointment.objects.filter(
            status='PENDING',
            end_time__lt=now
        ).update(status='CANCELLED')
        if user.user_role in [1, 4]:
            return Appointment.objects.all().order_by('date_time')
        
        return Appointment.objects.filter(
            Q(creator=user) | 
            Q(attendees=user) | 
            Q(legal_case__consultant=user)
        ).distinct().order_by('date_time')
    
    @action(detail=True, methods=['post'], url_path='respond')
    def respond(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['ACCEPTED', 'DECLINED']:
            return Response({'error': 'Trạng thái không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        attendee = AppointmentAttendee.objects.filter(appointment=appointment, user=request.user).first()
        if attendee:
            attendee.status = new_status
            attendee.save()
            return Response({'status': 'Đã cập nhật phản hồi'})
        return Response({'error': 'Bạn không có trong danh sách mời'}, status=status.HTTP_403_FORBIDDEN)
    
class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role in [1, 2, 3, 4]
    
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def get_queryset(self):
        user = self.request.user
        role = user.user_role
        if role == 0:
            return Task.objects.none()
        if role == 4:
             return Task.objects.all().order_by('deadline')
        return Task.objects.filter(
            Q(assignee=user) | 
            Q(creator=user) |
            Q(legal_case__consultant=user) | 
            Q(legal_case__assigned_lawyer=user) |
            Q(legal_case__assistant=user) |
            Q(legal_case__contracts__assigned_lawyer=user) |
            Q(legal_case__contracts__assigned_legal_assistant=user)
        ).distinct().order_by('deadline')
    
class CaseLogViewSet(viewsets.ModelViewSet):
    serializer_class = CaseLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        user = self.request.user
        print(f"🟢 [DEBUG] User đang request: {user.user_name} (ID: {user.pk}) - Role: {user.user_role}")
        case_id = self.request.query_params.get('legal_case')
        print(f"🟢 [DEBUG] Case ID frontend gửi lên: {case_id}")

        queryset = CaseLog.objects.all()
        if user.user_role in [1, 2, 3]:
            from .models import Contract
            contracts = Contract.objects.filter(assigned_lawyer=user)
            print(f"🟢 [DEBUG] User này đang là Luật sư của {contracts.count()} hợp đồng.")
            
            queryset = queryset.filter(
                Q(legal_case__assigned_staff=user) | 
                Q(legal_case__contracts__assigned_lawyer=user) | 
                Q(legal_case__contracts__assigned_legal_assistant=user)
            ).distinct()
            
        elif user.user_role == 0:
             queryset = queryset.filter(legal_case__client=user)

        print(f"🟢 [DEBUG] Số lượng Log sau khi lọc quyền: {queryset.count()}")
        if case_id:
            queryset = queryset.filter(legal_case_id=case_id)
            print(f"🟢 [DEBUG] Số lượng Log sau khi lọc Case ID: {queryset.count()}")

        return queryset.order_by('-date_occurred')


class ServicePackageViewSet(viewsets.ModelViewSet):
    serializer_class = ServicePackageSerializer
    permission_classes = [AllowAny] 
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()] 
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.is_anonymous or request.user.user_role != 4:
             return Response({"error": "Chỉ quản lý mới được thêm gói dịch vụ."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    queryset = ServicePackage.objects.filter(is_active=True)

class DashboardViewSet(viewsets.ViewSet):

    def check_permission(self, request):
        if request.user.user_role != 4:
            return Response(
                {"error": "Không có quyền truy cập dashboard"},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    @action(detail=False, methods=['get'])
    def overview(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        total_cases = LegalCase.objects.count()
        total_contracts = Contract.objects.count()

        total_revenue = Payment.objects.aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_staff = Users.objects.filter(
            user_role__in=[1,2,3,4]
        ).count()

        data = {
            "total_cases": total_cases,
            "total_contracts": total_contracts,
            "total_revenue": total_revenue,
            "total_staff": total_staff
        }

        return Response(data)

    @action(detail=False, methods=['get'])
    def cases(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        cases = LegalCase.objects.select_related(
            "assigned_staff",
            "client"
        )

        result = []

        for c in cases:
            result.append({
                "case_id": c.id,
                "title": c.title,
                "client": c.client.user_fullName,
                "assigned_staff": c.assigned_staff.user_fullName if c.assigned_staff else None,
                "status": c.status,
                #"current_stage": c.current_stage,
                "created_at": c.created_at
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def cases_by_status(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        data = (
            LegalCase.objects
            .values("status")
            .annotate(total=Count("id"))
        )

        return Response(list(data))


    @action(detail=False, methods=['get'])
    def contracts(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        contracts = Contract.objects.select_related(
            "legal_case",
            "assigned_lawyer",
            "assigned_legal_assistant"
        )

        result = []

        for c in contracts:

            result.append({
                "contract_number": c.contract_number,
                "case_title": c.legal_case.title,
                "lawyer": c.assigned_lawyer.user_fullName if c.assigned_lawyer else None,
                "assistant": c.assigned_legal_assistant.user_fullName if c.assigned_legal_assistant else None,
                "total_value": c.total_value,
                "status": c.status
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def contracts_by_status(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        data = (
            Contract.objects
            .values("status")
            .annotate(total=Count("id"))
        )

        return Response(list(data))

    @action(detail=False, methods=['get'])
    def cases_by_month(self, request):
        permission = self.check_permission(request)
        if permission:
            return permission

        cases = LegalCase.objects.all()
        data_dict = {}

        for c in cases:
            if c.created_at:
                month_str = c.created_at.strftime('%m/%Y')
                data_dict[month_str] = data_dict.get(month_str, 0) + 1

        result = [{"month": k, "total": v} for k, v in data_dict.items()]
        result.sort(key=lambda x: x["month"].split('/')[::-1])

        return Response(result)

    @action(detail=False, methods=['get'])
    def revenue_by_month(self, request):
        permission = self.check_permission(request)
        if permission:
            return permission

        payments = Payment.objects.all()
        revenue_dict = {}

        for p in payments:
            if p.payment_date:
                month_str = p.payment_date.strftime('%m/%Y')
                revenue_dict[month_str] = revenue_dict.get(month_str, 0) + p.amount

        result = [{"month": k, "total": v} for k, v in revenue_dict.items()]
        result.sort(key=lambda x: x["month"].split('/')[::-1])

        return Response(result)

    @action(detail=False, methods=['get'])
    def contracts_by_month(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        data = (
            Contract.objects
            .annotate(month=TruncMonth("signed_date"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )

        result = [
            {
                "month": item["month"].strftime("%m/%Y") if item["month"] else None,
                "total": item["total"]
            }
            for item in data
        ]

        return Response(result)


    @action(detail=False, methods=['get'])
    def staff(self, request):

        permission = self.check_permission(request)
        if permission:
            return permission

        staff = Users.objects.filter(user_role__in=[1,2,3,4])

        result = []

        for s in staff:

            role_name = dict(ROLE).get(s.user_role)

            result.append({
                "id": s.user_id,
                "name": s.user_fullName,
                "role": role_name
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def staff_performance(self, request):
        """
        Tính toán hiệu suất cho cả Luật sư (3) và Trợ lý (2)
        Dựa trên: (Số vụ đạt mục tiêu / Tổng số vụ phụ trách) * 100
        """
        permission = self.check_permission(request)
        if permission:
            return permission

        staff_members = Users.objects.filter(
            user_role__in=[2, 3], 
            is_active=True
        ).only('user_id', 'user_fullName', 'user_role')
        
        result = []

        for s in staff_members:
            involved_cases = LegalCase.objects.filter(
                Q(assigned_lawyer=s) | Q(assistant=s)
            )

            total_cases = involved_cases.distinct().count()
            successful_cases = involved_cases.filter(
                goal_achievement_status=1
            ).distinct().count()

            rate = 0
            if total_cases > 0:
                rate = round((successful_cases / total_cases) * 100, 2)
            role_label = "Luật sư" if s.user_role == 3 else "Trợ lý luật sư"

            result.append({
                "staff_id": s.user_id,
                "name": s.user_fullName,
                "role": role_label,
                "total_cases": total_cases,
                "successful_cases": successful_cases,
                "completion_rate": rate
            })

        result.sort(key=lambda x: (x["completion_rate"], x["total_cases"]), reverse=True)

        return Response(result)

    @action(detail=False, methods=['get'])
    def case_progress(self, request):
        permission = self.check_permission(request)
        if permission:
            return permission

        cases = LegalCase.objects.all()
        result = []

        for c in cases:
            progress = getattr(c, 'overall_progress', 0)

            if c.status == 'LIQUIDATED':
                progress = 100
            elif c.status in ['CANCELLED', 'REJECTED']:
                progress = 0

            result.append({
                "case_id": c.id,
                "title": c.title,
                "status": c.status,
                "progress": progress
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def service_usage_stats(self, request):
        permission = self.check_permission(request)
        if permission:
            return permission
        
        data = (
            LegalCase.objects
            .filter(service_package__isnull=False)
            .values("service_package__name") 
            .annotate(value=Count("id"))     
            .order_by("-value")
        )
        result = [
            {"name": item["service_package__name"], "value": item["value"]} 
            for item in data
        ]
        
        return Response(result)
    
@csrf_exempt
def check_conflict_of_interest(request):
    """
    API nhận thông tin Bên đối lập từ React và tìm kiếm khách hàng trùng lặp.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            opp_name = data.get('opposing_party_name', '').strip()
            opp_address = data.get('opposing_party_address', '').strip()

            if not opp_name:
                return JsonResponse({'error': 'Vui lòng cung cấp tên bên đối lập.'}, status=400)

            query_text = f"{opp_name} - {opp_address}"
            query_vector = embed_model.encode(query_text).tolist()
            suspect_clients = Users.objects.filter(user_role=0).annotate(
                distance=CosineDistance('embedding', query_vector)
            ).filter(distance__lt=0.15).order_by('distance')[:3]

            results = []
            for client in suspect_clients:
                similarity_score = round((1 - client.distance) * 100, 2)
                results.append({
                    'user_id': client.user_id,
                    'name': client.user_fullName,
                    'address': client.user_address,
                    'similarity': f"{similarity_score}%"
                })

            return JsonResponse({
                'status': 'success',
                'has_conflict': len(results) > 0,
                'matches': results
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Chỉ chấp nhận phương thức POST'}, status=405)

load_dotenv()


def get_user_cases(user):
    """Lấy danh sách vụ việc để AI biết ID chính xác"""
    cases = LegalCase.objects.filter(client=user).only('id', 'title')
    if not cases.exists():
        return "Bạn chưa có vụ việc nào. Hãy gửi yêu cầu tư vấn trước khi đặt lịch."
    
    res = "DANH SÁCH VỤ VIỆC CỦA BẠN (Hãy dùng ID này để đặt lịch):\n"
    for c in cases:
        res += f"- ID {c.id}: {c.title}\n"
    return res

import zoneinfo
from django.utils import timezone

def get_my_appointments(user):
    """Lấy danh sách lịch hẹn sắp tới"""
    now = timezone.now()
    appointments = Appointment.objects.filter(
        Q(creator=user) | Q(attendees=user)
    ).filter(date_time__gte=now).distinct().order_by('date_time')[:5]
    
    if not appointments.exists():
        return "Bạn hiện không có lịch hẹn nào sắp tới."
    res = "Lịch hẹn sắp tới của bạn:\n"
    vn_tz = zoneinfo.ZoneInfo('Asia/Ho_Chi_Minh')
    
    for app in appointments:
        local_dt = app.date_time.astimezone(vn_tz)
        
        res += f"- [ID: {app.id}] {app.title}: {local_dt.strftime('%H:%M %d/%m/%Y')} tại {app.location}\n"
        
    return res

from rest_framework.test import APIRequestFactory
def create_appointment_via_ai(user, title, date_time_str, location, legal_case_id):
    try:
        valid_case_id = int(legal_case_id)
        dt = datetime.fromisoformat(date_time_str.replace('Z', '+00:00'))
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)

        now = timezone.now()
        if dt.year < now.year: dt = dt.replace(year=now.year)
        if dt < now: dt = dt + timedelta(days=1)
        computed_end_time = dt + timedelta(hours=1)

        attendee_ids = [user.user_id] 
        try:
            target_case = LegalCase.objects.get(id=valid_case_id)
            if target_case.assigned_lawyer:
                attendee_ids.append(target_case.assigned_lawyer.user_id)
            if target_case.assistant:
                attendee_ids.append(target_case.assistant.user_id)
        except LegalCase.DoesNotExist:
            return f"Lỗi: Không tìm thấy vụ việc ID {valid_case_id}"

        data = {
            "title": title,
            "date_time": dt,
            "end_time": computed_end_time,
            "location": location,
            "legal_case": valid_case_id,
            "attendees": list(set(attendee_ids))
        }
        
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user

        serializer = AppointmentSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            appointment = serializer.save(creator=user)
            
            AppointmentAttendee.objects.filter(
                appointment=appointment, 
                user=user
            ).update(status='ACCEPTED')
            
            from .views import send_appointment_notification_task
            import threading
            thread = threading.Thread(target=send_appointment_notification_task, args=(appointment,))
            thread.start()
            
            return f"Thành công: Đã tạo lịch '{title}'. Bạn (chủ lịch) đã xác nhận, đang chờ các thành viên khác."
        else:
            return f"Thất bại: {serializer.errors}"
            
    except Exception as e:
        return f"Lỗi hệ thống: {str(e)}"

def update_appointment_via_ai(user, appointment_id, date_time_str=None, location=None, title=None):
    """Hàm để AI gọi khi muốn cập nhật một lịch hẹn có sẵn"""
    try:
        appointment = Appointment.objects.filter(
            Q(creator=user) | Q(attendees=user),
            id=appointment_id
        ).first()

        if not appointment:
            return f"Lỗi: Không tìm thấy lịch hẹn ID {appointment_id} thuộc quyền sở hữu của bạn."

        data = {}
        if title: data['title'] = title
        if location: data['location'] = location
        if date_time_str:
            dt = datetime.fromisoformat(date_time_str.replace('Z', '+00:00'))
            if timezone.is_naive(dt): dt = timezone.make_aware(dt)
            if dt.year < 2026: dt = dt.replace(year=2026)
            
            data['date_time'] = dt
            data['end_time'] = dt + timedelta(hours=1)

        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user

        serializer = AppointmentSerializer(appointment, data=data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return f"Thành công: Đã cập nhật lại lịch hẹn ID {appointment_id}. Thông báo đã được gửi lại cho các bên."
        else:
            return f"Thất bại khi cập nhật: {serializer.errors}"

    except Exception as e:
        return f"Lỗi hệ thống khi cập nhật: {str(e)}"
    

def cancel_appointment_via_ai(user, appointment_id):
    try:
        valid_id = int(appointment_id)
        
        with transaction.atomic():
            appointment_exists = Appointment.objects.filter(
                Q(creator=user) | Q(attendees=user),
                id=valid_id
            ).only('id').first()

            if not appointment_exists:
                return f"Lỗi: Không tìm thấy lịch hẹn ID {valid_id}."

            appointment = Appointment.objects.select_for_update().get(id=valid_id)

            if appointment.status in ['COMPLETED', 'CANCELLED']:
                return f"Thông báo: Lịch hẹn này vốn đã ở trạng thái {appointment.status} rồi."

            from rest_framework.test import APIRequestFactory
            factory = APIRequestFactory()
            mock_request = factory.post('/')
            mock_request.user = user

            data = {'status': 'CANCELLED'}
            serializer = AppointmentSerializer(
                appointment, 
                data=data, 
                partial=True, 
                context={'request': mock_request}
            )

            if serializer.is_valid():
                serializer.save()
                print(f"✅ [DEBUG] Chatbot đã cập nhật ID {valid_id} thành CANCELLED")
                return f"Thành công: Đã hủy lịch hẹn '{appointment.title}' (ID: {valid_id})."
            else:
                return f"Thất bại validation: {serializer.errors}"

    except Exception as e:
        print(f"❌ [ERROR AI-TOOL]: {str(e)}")
        return f"Lỗi hệ thống: {str(e)}"
    

def get_rag_context(user_query):
    """Truy xuất kiến thức pháp luật kết hợp Vector Search và Keyword Search"""
    query_vector = embed_model.encode(user_query).tolist()
    vector_chunks = LegalKnowledgeChunk.objects.annotate(
        distance=CosineDistance('embedding', query_vector)
    ).filter(distance__lt=0.45).order_by('distance')[:5]

    numbers = re.findall(r'\d+', user_query)
    keyword_chunks = []
    if numbers:
        for num in numbers:
            res = LegalKnowledgeChunk.objects.filter(content__icontains=num)[:3]
            keyword_chunks.extend(res)

    all_chunks = list(set(list(vector_chunks) + keyword_chunks))
    
    if not all_chunks:
        return "HỆ THỐNG: Không tìm thấy dữ liệu pháp luật cụ thể. Yêu cầu AI nhắc khách hàng cung cấp số hiệu văn bản chính xác."
        
    context_items = []
    for c in all_chunks:
        item = (
            f"NGUỒN: {c.law_reference.law_name}\n"
            f"VỊ TRÍ: {c.title}\n"
            f"NỘI DUNG: {c.content}\n"
            f"----------------"
        )
        context_items.append(item)
    return "\n".join(context_items)



import os
import json
from groq import Groq, RateLimitError

def call_groq_with_rotation(messages, tools=None, tool_choice="auto"):
    """
    Hàm hỗ trợ xoay vòng API Key khi gặp lỗi giới hạn request (429).
    """
    api_keys = [
        os.getenv("GROQ_API_KEY"),
        os.getenv("GROQ_API_KEY_1"),
        os.getenv("GROQ_API_KEY_2"),
    ]
    
    api_keys = [k for k in api_keys if k]

    for i, key in enumerate(api_keys):
        try:
            client = Groq(api_key=key)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=tools,
                temperature=0.0,
                tool_choice=tool_choice
            )
            return response, None  
        
        except RateLimitError:
            print(f"⚠️ Key thứ {i+1} đã hết hạn mức (Rate Limit). Đang thử Key tiếp theo...")
            continue 
            
        except Exception as e:
            print(f"❌ Lỗi hệ thống tại Key {i+1}: {str(e)}")
            return None, str(e)
            
    return None, "Tất cả API Keys đều đã hết hạn mức request. Vui lòng thử lại sau ít phút."

@api_view(['POST'])
@permission_classes([AllowAny])
def legal_chatbot(request):
    user_query = request.data.get('prompt', '').strip()
    s_key = request.data.get('session_key')
    if not user_query:
        return Response({"error": "Vui lòng nhập câu hỏi!"}, status=400)

    try:
        current_user = request.user if request.user.is_authenticated else None
        if not s_key:
            s_key = request.session.session_key or "default_session"

        if current_user:
            history_objs = ChatMessage.objects.filter(
                user=current_user, 
                session_key=s_key
            ).order_by('-created_at')[:6]
        else:
  
            history_objs = []

        chat_history = [{"role": msg.role, "content": msg.content} for msg in reversed(history_objs)]

        query_vector = embed_model.encode(user_query).tolist()
        related_chunks = LegalKnowledgeChunk.objects.annotate(
            distance=CosineDistance('embedding', query_vector)
        ).filter(distance__lt=0.45).order_by('distance')[:7]
        context_items = []
        for c in related_chunks:
            item = (
                f"NGUỒN: {c.law_reference.law_name}\n"
                f"VỊ TRÍ: {c.title}\n"
                f"NỘI DUNG: {c.content}\n"
                f"----------------"
            )
            context_items.append(item)

        context_text = "\n".join(context_items)
        services = ServicePackage.objects.filter(is_active=True).order_by('price')
        service_context = "\n".join([f"-Gói: {s.name} | Giá: {s.price} VND" for s in services])
        
        now_context = timezone.now().strftime('%A, ngày %d/%m/%Y, lúc %H:%M')

        system_instructions = f"""
        Bạn là Trợ lý Luật sư AI tại Việt Nam.

        Nhiệm vụ:
        (1) Tư vấn pháp luật
        (2) Giới thiệu dịch vụ
        (3) Hỗ trợ lịch hẹn

        =====================
        DỮ LIỆU HỖ TRỢ
        =====================
        1. Kiến thức luật (RAG):
        {context_text if context_text else "Không có dữ liệu cụ thể."}

        2. Danh sách dịch vụ:
        {service_context if service_context else "Đang cập nhật."}

        3. Thời gian hiện tại
        {now_context if now_context else "Đang cập nhật"}
        =====================
        NGUYÊN TẮC CHUNG
        =====================
        - Trả lời rõ ràng, trực tiếp, đúng trọng tâm
        - Ưu tiên dữ liệu RAG nếu có
        - Nếu RAG không đủ:
            + Từ chối trả lời nhẹ nhàn
            + Phải ghi: "Thông tin dưới đây mang tính tham khảo, bạn nên kiểm tra văn bản mới nhất."
        - KHÔNG được trả lời né tránh khi có thể suy luận hợp lý

        =====================
        KIỂM TRA VĂN BẢN PHÁP LUẬT
        =====================
        - Nếu người dùng nêu văn bản KHÔNG rõ ràng:
            + KHÔNG được đoán
            + Phải yêu cầu làm rõ hoặc nói không xác định được

        - KHÔNG được tự tạo:
            + Tên luật không có thật
            + Năm ban hành không chắc chắn
            + Điều/Khoản sai

        =====================
        PHÂN LOẠI CÂU HỎI
        =====================
        1. Tư vấn pháp luật
        2. Dịch vụ
        3. Lịch hẹn
        4. Ngoài phạm vi

        =====================
        CÁCH TRẢ LỜI
        =====================

        1. TƯ VẤN PHÁP LUẬT
        - Bắt buộc:
            + Trả lời trực tiếp trong 1-2 câu đầu
            + Sau đó trích dẫn quyên văn trong RAG

        - Nếu có RAG:
            + Trích dẫn đúng Điều/Khoản

        - Nếu không có RAG:
            + Vẫn trả lời bằng kiến thức chung
            + KHÔNG được bịa luật

        - Nếu không chắc chắn:
            + Phải nói rõ chưa đủ thông tin

        ---------------------

        2. DỊCH VỤ
        - Chỉ đề xuất 1 gói phù hợp nhất
        - Nêu:
            + Tên gói
            + Lý do phù hợp

        - Nếu không chắc giá:
            + Không nêu giá cụ thể
            + Dùng: "Chi phí sẽ được báo chi tiết khi tư vấn"

        ---------------------

        3. LỊCH HẸN (QUAN TRỌNG)
        - Xem lịch:
            + BẮT BUỘC gọi get_my_appointments
            + KHÔNG được tự trả lời

        - Đặt lịch:
            + Phải thu thập đủ:
                * tiêu đề
                * thời gian
                * địa điểm
                * case_id
            + Sau đó gọi create_appointment

        - Sửa lịch:
            + Nếu trong lịch sử trò chuyện có thông tin của 1 lịch hẹn thì dùng thông tin đó để cập nhật.
            + Nếu có nhiều lịch hẹn trong lich sử trò chuyện hoặc không xó thì gọi hàm get_my_appointments để liệt kê lịch hẹn cho khách hàng và hỏi khách hàn cần cập nhật lịch nào.
            + Khi khách hàng chọn 1 lịch hẹn thì dùng thông tin của lịch hẹn đó để cập nhật.
            + Phải có appointment_id
            + Dùng update_appointment

        - Hủy lịch:
            + Nếu trong lịch sử trò chuyện có thông tin của 1 lịch hẹn thì dùng thông tin đó để hủy.
            + Nếu có nhiều lịch hẹn trong lich sử trò chuyện hoặc không xó thì gọi hàm get_my_appointments để liệt kê lịch hẹn cho khách hàng và hỏi khách hàn hủy nhật lịch nào.
            + Khi khách hàng chọn 1 lịch hẹn thì dùng thông tin của lịch hẹn đó để hủy.
            + Phải có appointment_id.
            + Dùng update_appointment chỉ cập nhật trạng thái thôi còn  tiêu đề, thời gian, địa điểm, case_id  thì để nguyên.

        - Khi xử lý lịch:
            + KHÔNG được thêm tư vấn pháp luật

        ---------------------

        4. NGOÀI PHẠM VI
        - Trả lời ngắn gọn, hữu ích
        - KHÔNG dùng câu "Thông tin mang tính tham khảo..."

        - Sau đó điều hướng nhẹ:
            "Nếu bạn cần hỗ trợ pháp lý, tôi sẵn sàng giúp."

        =====================
        QUY TẮC QUAN TRỌNG
        =====================
        - Không trả lời câu hỏi liên quan đến lách luật
        - Không được bịa thông tin pháp lý
        - Không được đoán văn bản pháp luật
        - Không được từ chối khi có thể trả lời
        - Không được in:
            + code
            + JSON
            + tên function

        - Nếu cần tool:
            + Phải gọi tool trước
            + Sau đó mới trả lời

        =====================
        KẾT THÚC
        =====================
        - Nếu liên quan pháp lý:
            → Gợi ý:
            "Bạn có thể gửi yêu cầu tư vấn hoặc đặt lịch để Luật sư hỗ trợ chi tiết hơn."
        """
        tools = [
            {"type": "function", "function": {"name": "get_user_cases", "description": "Lấy danh sách vụ việc của người dùng."}},
            {"type": "function", "function": {"name": "get_my_appointments", "description": "Xem danh sách lịch hẹn sắp tới của người dùng."}},
            {
                "type": "function",
                "function": {
                    "name": "create_appointment",
                    "description": "Tạo lịch hẹn mới khi ĐÃ CÓ ĐỦ thông tin.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            # Cập nhật trong cả tool create_appointment và update_appointment
                            "date_time": {
                                "type": "string", 
                                "description": "Định dạng YYYY-MM-DDTHH:MM:00 (QUAN TRỌNG: Giữ nguyên giờ địa phương của khách, TUYỆT ĐỐI KHÔNG đổi sang UTC, KHÔNG thêm chữ Z. VD: Khách hẹn 13:00 thì gửi đúng T13:00:00)"
                            },
                            "location": {"type": "string"},
                            "legal_case_id": {"type": "integer"}
                        },
                        "required": ["title", "date_time", "location", "legal_case_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_appointment",
                    "description": "Sửa/Cập nhật giờ hoặc thông tin lịch hẹn cũ.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {"type": "integer"},
                            # Cập nhật trong cả tool create_appointment và update_appointment
                            "date_time": {
                                "type": "string", 
                                "description": "Định dạng YYYY-MM-DDTHH:MM:00 (QUAN TRỌNG: Giữ nguyên giờ địa phương của khách, TUYỆT ĐỐI KHÔNG đổi sang UTC, KHÔNG thêm chữ Z. VD: Khách hẹn 13:00 thì gửi đúng T13:00:00)"
                            },
                            "location": {"type": "string"},
                            "title": {"type": "string"}
                        },
                        "required": ["appointment_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_appointment",
                    "description": "Hủy một lịch hẹn hiện có dựa trên ID.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {"type": "integer", "description": "ID của lịch hẹn cần hủy"}
                        },
                        "required": ["appointment_id"]
                    }
                }
            }
        ]

        # 6. GỌI API GROQ LẦN 1
        messages = [{"role": "system", "content": system_instructions}]
        messages.extend(chat_history)
        messages.append({"role": "user", "content": user_query})

        response, error_msg = call_groq_with_rotation(messages, tools=tools)
        if error_msg:
            return Response({"error": error_msg}, status=503)

        resp_msg = response.choices[0].message
        tool_calls = resp_msg.tool_calls

        # 7. XỬ LÝ TOOL CALLS
        if tool_calls:
            # Lưu ý: Cần append thông điệp AI muốn gọi tool vào messages
            messages.append(resp_msg) 
            
            for tool_call in tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                fn_res = "Hệ thống đang gặp sự cố nhỏ, vui lòng thử lại."

                if not current_user:
                    fn_res = "Vui lòng đăng nhập để thực hiện chức năng này."
                else:
                    if fn_name == "get_user_cases":
                        fn_res = get_user_cases(current_user)
                    elif fn_name == "get_my_appointments":
                        fn_res = get_my_appointments(current_user)
                    elif fn_name == "create_appointment":
                        fn_res = create_appointment_via_ai(
                            current_user, fn_args.get('title'), fn_args.get('date_time'),
                            fn_args.get('location'), fn_args.get('legal_case_id')
                        )
                    elif fn_name == "update_appointment":
                        fn_res = update_appointment_via_ai(
                            current_user, 
                            appointment_id=fn_args.get('appointment_id'),
                            date_time_str=fn_args.get('date_time'),
                            location=fn_args.get('location'),
                            title=fn_args.get('title')
                        )
                    elif fn_name == "cancel_appointment":
                        fn_res = cancel_appointment_via_ai(
                            current_user,
                            appointment_id=fn_args.get('appointment_id')
                        )
                
                # Phản hồi kết quả Tool cho AI (role="tool")
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": fn_name,
                    "content": str(fn_res),
                })
            
            # GỌI API LẦN 2 để AI tổng hợp câu trả lời từ kết quả Tool
            final_resp, error_msg_2 = call_groq_with_rotation(messages)
            if error_msg_2:
                return Response({"error": error_msg_2}, status=503)
            ai_answer = final_resp.choices[0].message.content
        else:
            # Lấy câu trả lời text của AI
            ai_answer = resp_msg.content
            
            # --- BẪY LỖI BẢO VỆ GIAO DIỆN ---
            # Nếu phát hiện AI in code ra text, chặn lại ngay!
            if "function:" in ai_answer or "<function>" in ai_answer or "{" in ai_answer:
                print(f"⚠️ [CẢNH BÁO LỖI AI]: {ai_answer}")
                ai_answer = "Dạ, tôi đang tiến hành cập nhật lịch hẹn cho bạn nhưng gặp chút sự cố kết nối. Bạn vui lòng nhắc lại yêu cầu đổi lịch (Ví dụ: Đổi lịch ID 9 sang 15:30) giúp tôi nhé!"

        # 8. LƯU TIN NHẮN VÀ TRẢ VỀ
        if current_user:
            ChatMessage.objects.create(user=current_user, session_key=s_key, role='user', content=user_query)
            ChatMessage.objects.create(user=current_user, session_key=s_key, role='assistant', content=ai_answer)

        return Response({"answer": ai_answer, "is_legal": len(related_chunks) > 0}, status=200)

    except Exception as e:
        print(f"--- [ERROR]: {str(e)} ---")
        return Response({"error": "Hệ thống đang bận, vui lòng thử lại sau."}, status=500)
      

@api_view(['GET'])
@permission_classes([AllowAny])
def get_chat_history(request):
    """
    API giúp lấy lại toàn bộ hội thoại cũ của User hoặc Session hiện tại.
    """
    current_user = request.user if request.user.is_authenticated else None
    
    if current_user:
        history = ChatMessage.objects.filter(user=current_user).order_by('created_at')
    else:
        s_key = request.session.session_key
        if not s_key:
            return Response([]) # Chưa có session thì trả về mảng rỗng
        history = ChatMessage.objects.filter(session_key=s_key, user__isnull=True).order_by('created_at')
    
    serializer = ChatMessageSerializer(history, many=True)
    return Response(serializer.data)


import os
import re
from docx import Document as DocxDocument
from django.db import transaction
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import LawReference, LegalKnowledgeChunk, embed_model
import subprocess
import win32com.client as win32
import pythoncom
import pypandoc
import os

def convert_doc_to_docx(doc_path):
    """Sử dụng Pandoc để convert .doc sang .docx (Sạch và không cần Word)"""
    try:
        # Đường dẫn tuyệt đối để tránh lỗi tìm file
        abs_doc_path = os.path.abspath(doc_path)
        abs_docx_path = os.path.splitext(abs_doc_path)[0] + ".docx"
        
        # Tiến hành chuyển đổi
        # 'docx' là định dạng đích bạn muốn có
        pypandoc.convert_file(abs_doc_path, 'docx', outputfile=abs_docx_path)
        
        if os.path.exists(abs_docx_path):
            print(f"✅ Tuyệt vời! Pandoc đã xử lý xong: {abs_docx_path}")
            return abs_docx_path
        return None
    except Exception as e:
        print(f"❌ Lỗi Pandoc: {str(e)}")
        return None
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_law_document(request):
    file_obj = request.FILES.get('file')
    law_name = request.data.get('law_name')
    
    # Kiểm tra đầu vào
    if not file_obj or not law_name:
        return Response({"error": "Vui lòng cung cấp file và tên bộ luật."}, status=400)

    # Kiểm tra đuôi file thủ công
    extension = os.path.splitext(file_obj.name)[1].lower()
    if extension not in ['.docx', '.doc']:
        return Response({"error": "Chỉ hỗ trợ .doc và .docx"}, status=400)
    
    try:
        # Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        with transaction.atomic():

            # ===== BƯỚC 1: LƯU FILE =====
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'documents', '2026')
            os.makedirs(upload_dir, exist_ok=True)

            file_path = os.path.join(upload_dir, file_obj.name)
            with open(file_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)

            if extension == '.doc':
                converted_path = convert_doc_to_docx(file_path)
                if not converted_path or not os.path.exists(converted_path):
                    # Nếu convert lỗi, ta chủ động trả về lỗi 500
                    raise Exception("Không thể chuyển đổi file .doc sang .docx bằng Word")
                
                # CẬP NHẬT LẠI file_path ĐỂ BƯỚC 2 (DocxDocument) ĐỌC ĐÚNG FILE MỚI
                file_path = converted_path

            # ===== BƯỚC 2: DOCX → TEXT (GIỮ NGUYÊN XUỐNG DÒNG) =====
            doc = DocxDocument(file_path)
            full_text = []

            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    full_text.append(text)

            text_content = "\n".join(full_text)


            # ===== BƯỚC 3: XỬ LÝ REGEX (CONTEXTUAL CHUNKING) =====
            chunks_data = []
            # 3.1 Cắt bỏ phần mào đầu từ "Điều 1"
            start_match = re.search(r'(^|\n)(Điều\s+1\.)', text_content, re.IGNORECASE)
            if start_match:
                preamble_text = text_content[:start_match.start(2)].strip()
                if preamble_text:
                    chunks_data.append({
                        "title": "Thông tin chung và Hiệu lực văn bản",
                        "content": preamble_text
                    })
                text_processed = text_content[start_match.start(2):]
            else:
                text_processed = text_content

            # 3.2 Tách điều luật phân cấp
            current_dieu = ""
            current_khoan = ""
            temp_content = []
            temp_title = ""

            lines = text_processed.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                if re.match(r'^Điều\s+\d+', line, re.IGNORECASE):
                    if temp_content:
                        chunks_data.append({"title": temp_title, "content": " ".join(temp_content)})
                        temp_content = []
                    
                    current_dieu = line.split('.')[0].strip()
                    current_khoan = "" 
                    temp_title = current_dieu
                    temp_content.append(line)

                elif re.match(r'^\d+\.\s', line):
                    if temp_content:
                        chunks_data.append({"title": temp_title, "content": " ".join(temp_content)})
                        temp_content = []
                    
                    current_khoan = line.split('.')[0].strip()
                    temp_title = f"{current_dieu}, Khoản {current_khoan}".strip(", ")
                    context_prefix = f"{temp_title}:"
                    temp_content.append(f"{context_prefix} {line}")

                elif re.match(r'^[a-zđ]\)\s', line, re.IGNORECASE):
                    if temp_content:
                        chunks_data.append({"title": temp_title, "content": " ".join(temp_content)})
                        temp_content = []
                    
                    diem_letter = line.split(')')[0].strip()
                    temp_title = f"{current_dieu}, Khoản {current_khoan}, Điểm {diem_letter}".strip(", ")
                    context_prefix = f"{temp_title}:"
                    temp_content.append(f"{context_prefix} {line}")

                else:
                    if not temp_title:
                        temp_title = "Đoạn mở đầu"
                    temp_content.append(line)

            if temp_content:
                chunks_data.append({"title": temp_title, "content": " ".join(temp_content)})


            # ===== BƯỚC 4: LƯU DB + EMBEDDING =====
            law_ref, created = LawReference.objects.get_or_create(
                law_name=law_name,
                defaults={'file_path': f'documents/2026/{file_obj.name}'}
            )

            new_chunks_list = []

            for chunk_dict in chunks_data:
                clean_title = chunk_dict["title"]
                content_to_embed = chunk_dict["content"]

                vector = embed_model.encode(content_to_embed).tolist()

                new_chunks_list.append(
                    LegalKnowledgeChunk(
                        law_reference=law_ref,
                        title=clean_title,
                        content=content_to_embed,
                        embedding=vector
                    )
                )

            LegalKnowledgeChunk.objects.bulk_create(new_chunks_list)

        return Response({
            "message": f"Thành công! Đã lưu file và nạp {len(new_chunks_list)} đoạn tri thức pháp luật vào hệ thống.",
            "law": law_name
        }, status=201)

    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        return Response(
            {"error": f"Lỗi hệ thống trong quá trình nạp tri thức: {str(e)}"},
            status=500
        )


class LawReferenceViewSet(viewsets.ModelViewSet):
    queryset = LawReference.objects.all().order_by('-created_at')
    serializer_class = LawReferenceSerializer
    permission_classes = [AllowAny] 