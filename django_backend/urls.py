"""
ASTU Laboratory Allocation System - Django URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LaboratoryBlockViewSet,
    LaboratoryRoomViewSet,
    ARAUserViewSet,
    ScheduledSessionViewSet,
    PreferenceSubmissionViewSet,
    AssignmentOverrideViewSet,
    WeightConfigurationViewSet,
)

router = DefaultRouter()
router.register(r'blocks', LaboratoryBlockViewSet, basename='laboratory-block')
router.register(r'rooms', LaboratoryRoomViewSet, basename='laboratory-room')
router.register(r'aras', ARAUserViewSet, basename='ara-user')
router.register(r'sessions', ScheduledSessionViewSet, basename='scheduled-session')
router.register(r'preferences', PreferenceSubmissionViewSet, basename='preference-submission')
router.register(r'overrides', AssignmentOverrideViewSet, basename='assignment-override')
router.register(r'weights', WeightConfigurationViewSet, basename='weight-configuration')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
