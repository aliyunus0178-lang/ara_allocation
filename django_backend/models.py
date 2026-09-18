"""
Adama Science and Technology University (ASTU)
School of Electrical Engineering & Computing
ARA Laboratory Allocation System - Django ORM Models
SRS Version 2.0 (Final) — Revised and Consolidated
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class LaboratoryBlock(models.Model):
    """
    Section 2: Laboratory Block Structure
    Logical grouping of laboratory rooms (e.g. B-510).
    """
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Maintenance', 'Maintenance'),
        ('Inactive', 'Inactive'),
    ]

    block_code = models.CharField(max_length=20, unique=True, help_text="e.g. B-510")
    building = models.CharField(max_length=150, help_text="Building or complex name")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.block_code} - {self.name}"

    class Meta:
        db_table = 'laboratory_blocks'
        ordering = ['block_code']


class LaboratoryRoom(models.Model):
    """
    Section 2 & 4: Laboratory Room Entity
    """
    LAB_TYPES = [
        ('Software', 'Software'),
        ('Hardware/Embedded', 'Hardware/Embedded'),
        ('Networking', 'Networking'),
        ('General Purpose', 'General Purpose'),
        ('AI & Robotics', 'AI & Robotics'),
    ]

    block = models.ForeignKey(LaboratoryBlock, on_delete=models.CASCADE, related_name='rooms')
    room_code = models.CharField(max_length=30, unique=True, help_text="e.g. B-510-R05")
    room_name = models.CharField(max_length=150)
    capacity = models.PositiveIntegerField(default=40)
    lab_type = models.CharField(max_length=30, choices=LAB_TYPES, default='Software')
    status = models.CharField(max_length=20, default='Active')

    def __str__(self):
        return f"{self.room_code} ({self.room_name})"

    class Meta:
        db_table = 'laboratory_rooms'
        ordering = ['room_code']


class ARAUser(models.Model):
    """
    Section 1 & 15: Academic Resource Assistant (ARA) User Entity
    """
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Suspended', 'Suspended'),
        ('On Leave', 'On Leave'),
        ('Pending Approval', 'Pending Approval'),
        ('Expired', 'Expired'),
    ]
    ROLE_CHOICES = [
        ('BLOCK_RESPONSIBLE', 'Laboratory Block Responsible ARA'),
        ('ROOM_KEY_HOLDER', 'Laboratory Room Key Holder'),
        ('COURSE_RESPONSIBLE', 'Course/Laboratory Responsible ARA'),
        ('GENERAL_ARA', 'General ARA'),
    ]

    ara_code = models.CharField(max_length=20, unique=True, help_text="e.g. ARA-001")
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100, default='Computer Science & Engineering')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='GENERAL_ARA')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    max_weekly_hours = models.DecimalField(max_digits=4, decimal_places=1, default=12.0)
    created_at = models.DateTimeField(auto_now_add=True, help_text="Seniority tie-breaker timestamp")

    def __str__(self):
        return f"{self.ara_code} - {self.full_name}"

    class Meta:
        db_table = 'ara_users'
        ordering = ['created_at']


class ARABlockResponsibility(models.Model):
    """
    Section 3: Laboratory Block Responsible ARA
    """
    block = models.ForeignKey(LaboratoryBlock, on_delete=models.CASCADE, related_name='block_responsibilities')
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='block_responsibilities')
    is_primary = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False, help_text="Section 14: Only this ARA may supervise")
    start_date = models.DateField()
    end_date = models.DateField()
    academic_year = models.CharField(max_length=20, default='2026/2027')
    semester = models.CharField(max_length=20, default='Semester I')
    status = models.CharField(max_length=20, default='Active')

    class Meta:
        db_table = 'ara_block_responsibilities'


class ARARoomResponsibility(models.Model):
    """
    Section 4: Room-Level Key Holder
    """
    room = models.ForeignKey(LaboratoryRoom, on_delete=models.CASCADE, related_name='room_responsibilities')
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='room_responsibilities')
    is_primary = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False, help_text="Section 14")
    start_date = models.DateField()
    end_date = models.DateField()
    academic_year = models.CharField(max_length=20, default='2026/2027')
    semester = models.CharField(max_length=20, default='Semester I')
    status = models.CharField(max_length=20, default='Active')

    class Meta:
        db_table = 'ara_room_responsibilities'


class Course(models.Model):
    course_code = models.CharField(max_length=20, unique=True, help_text="e.g. CSEg 1104")
    course_name = models.CharField(max_length=150)
    department = models.CharField(max_length=100, default='Computer Science & Engineering')
    credit_hours = models.PositiveIntegerField(default=3)
    lab_session_duration_hours = models.DecimalField(max_digits=3, decimal_places=1, default=2.0)

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

    class Meta:
        db_table = 'courses'


class ARACourseResponsibility(models.Model):
    """
    Section 5: Course/Laboratory Responsibility
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_responsibilities')
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='course_responsibilities')
    academic_year = models.CharField(max_length=20, default='2026/2027')
    semester = models.CharField(max_length=20, default='Semester I')
    status = models.CharField(max_length=20, default='Active')

    class Meta:
        db_table = 'ara_course_responsibilities'


class ARAQualification(models.Model):
    """
    Section 5 & 17: ara_qualifications entity
    Hard eligibility constraint check.
    """
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='qualifications')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='qualifications')
    qualified_date = models.DateField()
    expiry_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Valid')
    certified_by = models.CharField(max_length=150, default='ASTU Curriculum Committee')

    class Meta:
        db_table = 'ara_qualifications'
        unique_together = ('ara', 'course')


class ScheduledSession(models.Model):
    """
    Scheduled laboratory session for a semester.
    """
    STATUS_CHOICES = [
        ('Unassigned', 'Unassigned'),
        ('Tentatively Assigned', 'Tentatively Assigned'),
        ('Confirmed', 'Confirmed'),
        ('ARA Assignment Required', 'ARA Assignment Required'),
    ]
    DAYS = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    room = models.ForeignKey(LaboratoryRoom, on_delete=models.CASCADE, related_name='sessions')
    section = models.CharField(max_length=20, help_text="e.g. Section 1")
    group = models.CharField(max_length=20, help_text="e.g. Group 1")
    day_of_week = models.CharField(max_length=15, choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_hours = models.DecimalField(max_digits=3, decimal_places=1, default=2.0)
    required_ara_count = models.PositiveIntegerField(default=1, help_text="Section 12: Multi-ARA")
    academic_year = models.CharField(max_length=20, default='2026/2027')
    semester = models.CharField(max_length=20, default='Semester I')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Unassigned')

    class Meta:
        db_table = 'scheduled_sessions'


class PreferenceSubmission(models.Model):
    """
    Section 9.4 & 10: preference_submissions entity
    """
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Auto-Assigned (Tentative)', 'Auto-Assigned (Tentative)'),
        ('Auto-Assigned (Final)', 'Auto-Assigned (Final)'),
        ('Rejected', 'Rejected'),
        ('Withdrawn', 'Withdrawn'),
    ]

    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='preference_submissions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='preference_submissions')
    preference_rank = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(3)])
    submitted_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Pending')
    resolved_session = models.ForeignKey(ScheduledSession, on_delete=models.SET_NULL, null=True, blank=True)
    resolution_reason = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'preference_submissions'


class AssistantAssignment(models.Model):
    """
    Section 11, 12, 15: assistant_assignments entity
    """
    STATUS_CHOICES = [
        ('Tentative', 'Tentative'),
        ('Confirmed', 'Confirmed'),
        ('Declined', 'Declined'),
    ]
    SOURCE_CHOICES = [
        ('batch_engine', 'Batch Engine'),
        ('realtime_submission', 'Real-Time Preference Submission'),
        ('authorized_override', 'Authorized Override'),
        ('manual_admin', 'Manual Admin Allocation'),
    ]

    session = models.ForeignKey(ScheduledSession, on_delete=models.CASCADE, related_name='assignments')
    slot_number = models.PositiveIntegerField(default=1, help_text="Section 12 slot indicator")
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Tentative')
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='batch_engine')
    assigned_at = models.DateTimeField(default=timezone.now)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'assistant_assignments'
        unique_together = ('session', 'slot_number')


class AssignmentDecisionReason(models.Model):
    """
    Section 7 & 17: assignment_decision_reasons entity
    Exact explanation matching SRS example.
    """
    assignment = models.ForeignKey(AssistantAssignment, on_delete=models.CASCADE, related_name='decision_reasons', null=True)
    session = models.ForeignKey(ScheduledSession, on_delete=models.CASCADE)
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE)
    total_score = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    reasons = models.JSONField(default=list)
    score_breakdown = models.JSONField(default=list)
    hard_constraints_passed = models.BooleanField(default=True)
    block_responsibility = models.BooleanField(default=False)
    room_key_holder = models.BooleanField(default=False)
    course_responsibility = models.BooleanField(default=False)
    preference_match = models.CharField(max_length=50, default='None')
    qualified = models.BooleanField(default=True)
    available = models.BooleanField(default=True)
    timetable_conflict = models.BooleanField(default=False)
    workload_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assignment_decision_reasons'


class AssignmentOverride(models.Model):
    """
    Section 14.3 & 17: assignment_overrides entity
    Audit trail for authorized administrator overrides of mandatory responsibilities.
    """
    session = models.ForeignKey(ScheduledSession, on_delete=models.CASCADE)
    overriding_user = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='overrides_issued')
    original_candidate = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='overridden_from')
    assigned_ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE, related_name='overridden_to')
    reason = models.TextField(help_text="Required free-text explanation for audit")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assignment_overrides'


class WeightConfiguration(models.Model):
    """
    Section 8.1 & 17: weight_configurations entity
    """
    scope = models.CharField(max_length=50, default='institution')
    factor_name = models.CharField(max_length=100)
    weight_value = models.IntegerField(default=50)
    is_enabled = models.BooleanField(default=True)
    effective_date = models.DateField(default=timezone.now)

    class Meta:
        db_table = 'weight_configurations'
