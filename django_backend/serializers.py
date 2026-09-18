"""
Adama Science and Technology University (ASTU)
School of Electrical Engineering & Computing
ARA Laboratory Allocation System - Django REST Framework Serializers
"""

from rest_framework import serializers
from .models import (
    LaboratoryBlock,
    LaboratoryRoom,
    ARAUser,
    ARABlockResponsibility,
    ARARoomResponsibility,
    ARACourseResponsibility,
    ARAQualification,
    Course,
    ScheduledSession,
    PreferenceSubmission,
    AssistantAssignment,
    AssignmentDecisionReason,
    AssignmentOverride,
    WeightConfiguration,
)


class LaboratoryBlockSerializer(serializers.ModelSerializer):
    rooms_count = serializers.IntegerField(source='rooms.count', read_only=True)

    class Meta:
        model = LaboratoryBlock
        fields = '__all__'


class LaboratoryRoomSerializer(serializers.ModelSerializer):
    block_code = serializers.CharField(source='block.block_code', read_only=True)

    class Meta:
        model = LaboratoryRoom
        fields = '__all__'


class ARAUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ARAUser
        fields = '__all__'


class ARAQualificationSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    ara_name = serializers.CharField(source='ara.full_name', read_only=True)

    class Meta:
        model = ARAQualification
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class ScheduledSessionSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    room_code = serializers.CharField(source='room.room_code', read_only=True)

    class Meta:
        model = ScheduledSession
        fields = '__all__'


class PreferenceSubmissionSerializer(serializers.ModelSerializer):
    ara_name = serializers.CharField(source='ara.full_name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)

    class Meta:
        model = PreferenceSubmission
        fields = '__all__'


class AssistantAssignmentSerializer(serializers.ModelSerializer):
    ara_code = serializers.CharField(source='ara.ara_code', read_only=True)
    ara_name = serializers.CharField(source='ara.full_name', read_only=True)

    class Meta:
        model = AssistantAssignment
        fields = '__all__'


class AssignmentDecisionReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentDecisionReason
        fields = '__all__'


class AssignmentOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentOverride
        fields = '__all__'


class WeightConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightConfiguration
        fields = '__all__'
