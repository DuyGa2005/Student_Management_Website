# configurations/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('quydinh/', views.ListCreateQuyDinhView.as_view(), name='list-create-quydinh'),
    path('quydinh/latest/', views.LatestQuyDinhView.as_view(), name='latest-quydinh'),
    path('quydinh/<int:IDNienKhoa>/', views.QuyDinhDetailView.as_view(), name='detail-quydinh'),
]