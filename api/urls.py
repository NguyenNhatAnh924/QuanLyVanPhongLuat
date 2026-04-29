from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UsersViewSet, basename='users')

router.register(r'cases', views.LegalCaseViewSet, basename='cases')
router.register(r'documents', views.DocumentViewSet, basename='documents')
router.register(r'contracts', views.ContractViewSet, basename='contracts')
router.register(r'payments', views.PaymentViewSet, basename='payments')
router.register(r'feedbacks', views.FeedbackViewSet, basename='feedbacks')
router.register(r'appointments', views.AppointmentViewSet, basename='appointments')
router.register(r'tasks', views.TaskViewSet, basename='tasks')
router.register(r'logs', views.CaseLogViewSet, basename='logs')
router.register(r'services', views.ServicePackageViewSet, basename='services')
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')
router.register(r'law-references', views.LawReferenceViewSet, basename='law-references')
router.register(r'progress-steps', views.CaseProgressStepViewSet, basename='progress-steps')

urlpatterns = [
    path('', include(router.urls)),
    path('create_vnpay_payment/', views.create_vnpay_payment, name='create_vnpay_payment'),
    path('vnpay_return/', views.vnpay_return, name='vnpay_return'),
    path('check-coi/', views.check_conflict_of_interest, name='check-coi'),
    path('chat/', views.legal_chatbot, name='legal_chatbot'),
    path('upload-law/', views.upload_law_document, name='upload_law_document'),
    path('chat/', views.legal_chatbot),
    path('chat/history/', views.get_chat_history),
]