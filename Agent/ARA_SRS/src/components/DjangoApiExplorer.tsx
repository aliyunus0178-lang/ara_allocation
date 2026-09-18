import React, { useState } from 'react';
import { 
  Code, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  FileCode2, 
  Database,
  ExternalLink
} from 'lucide-react';

export const DjangoApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('batch');
  const [activeCodeTab, setActiveCodeTab] = useState<string>('models');
  const [copied, setCopied] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTestApi = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (selectedEndpoint === 'batch') {
        setApiResponse({
          status: 'success',
          algorithm: 'Authoritative Weighted Scoring Engine (SRS v2.0)',
          execution_timestamp: new Date().toISOString(),
          processed_sessions: 15,
          assigned_count: 14,
          unresolved_count: 1,
          unresolved_session_id: 'session-cseg3104-sec1-grp1',
          diagnostic: 'ARA Assignment Required: Zero candidates satisfied Section 6 hard constraints.'
        });
      } else if (selectedEndpoint === 'preferences') {
        setApiResponse({
          status: 'success',
          submission_id: 'pref-django-auto-908',
          ara_code: 'ARA-001',
          course_code: 'CSEg 1104',
          preference_rank: 1,
          realtime_allocated: true,
          assigned_session_id: 'session-cseg1104-sec1-grp1',
          allocation_state: 'Auto-Assigned (Tentative)',
          message: 'Immediate availability check matched open session B-510-R05. Hard constraints verified.'
        });
      } else if (selectedEndpoint === 'blocks') {
        setApiResponse([
          {
            id: 'block-b510',
            block_code: 'B-510',
            name: 'Computer Science & Software Engineering Laboratory Block',
            building: 'Block 510 - Tech Campus',
            total_rooms: 15,
            status: 'Active',
            rooms_count: 15
          },
          {
            id: 'block-b511',
            block_code: 'B-511',
            name: 'Electrical, Electronics & Hardware Systems Block',
            building: 'Block 511 - Tech Campus',
            total_rooms: 12,
            status: 'Active',
            rooms_count: 12
          }
        ]);
      } else if (selectedEndpoint === 'weights') {
        setApiResponse({
          model: 'Authoritative Scoring Model (SRS §8)',
          factors: {
            ROOM_KEY_HOLDER: 60,
            BLOCK_RESPONSIBLE: 50,
            COURSE_RESPONSIBLE: 45,
            PREFERENCE_1: 40,
            PREFERENCE_2: 30,
            PREFERENCE_3: 20,
            HISTORICAL_ASSIGNMENT: 10,
            PREFERRED_DAY: 10,
            PREFERRED_TIME: 10
          },
          tie_breakers: ['Lower Workload', 'ARA Seniority', 'Admin Flag']
        });
      }
      setIsLoading(false);
    }, 450);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                <Server className="w-3.5 h-3.5" />
                Backend Architecture • Django 5.x & DRF
              </span>
              <span className="text-xs text-slate-500 font-mono">
                RESTful API Endpoints & Python Assignment Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              ASTU Django REST Framework (DRF) API Console & Codebase
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production Django architecture matching the SRS v2.0 data model, serializers, viewsets, and Python assignment service.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Django 5.1 / DRF 3.15 Ready</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Django API Runner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Live DRF Endpoint Simulation
              </h3>
            </div>
            <button
              onClick={handleTestApi}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002147] hover:bg-[#001733] text-amber-400 font-bold rounded-lg shadow-sm border border-amber-500/30 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Executing...' : 'Dispatch Request'}</span>
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select API Route to Query:
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedEndpoint('batch')}
                className={`p-2 rounded border text-left transition-colors ${
                  selectedEndpoint === 'batch'
                    ? 'bg-slate-900 text-amber-400 border-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-emerald-500 font-bold">POST</span> /api/v1/sessions/run-batch-assignment/
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint('preferences')}
                className={`p-2 rounded border text-left transition-colors ${
                  selectedEndpoint === 'preferences'
                    ? 'bg-slate-900 text-amber-400 border-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-emerald-500 font-bold">POST</span> /api/v1/preferences/submit-realtime-preference/
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint('blocks')}
                className={`p-2 rounded border text-left transition-colors ${
                  selectedEndpoint === 'blocks'
                    ? 'bg-slate-900 text-amber-400 border-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-sky-500 font-bold">GET</span> /api/v1/blocks/
              </button>

              <button
                type="button"
                onClick={() => setSelectedEndpoint('weights')}
                className={`p-2 rounded border text-left transition-colors ${
                  selectedEndpoint === 'weights'
                    ? 'bg-slate-900 text-amber-400 border-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-sky-500 font-bold">GET</span> /api/v1/weights/
              </button>
            </div>
          </div>

          {/* Response Box */}
          <div>
            <div className="flex items-center justify-between text-slate-600 mb-1 font-mono text-[11px]">
              <span>HTTP 200 OK • Content-Type: application/json</span>
              <span>REST Client Engine</span>
            </div>
            <pre className="bg-[#001733] text-amber-300 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[300px] border border-amber-500/20">
              {apiResponse
                ? JSON.stringify(apiResponse, null, 2)
                : '// Click "Dispatch Request" above to test the Django REST Framework endpoint'}
            </pre>
          </div>
        </div>

        {/* Right Column: Django Python Code Viewer */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Django Backend Source Files
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">/django_backend/</span>
          </div>

          {/* Code Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-[11px] font-mono">
            {['models', 'serializers', 'views', 'assignment_engine', 'urls'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`px-3 py-1.5 rounded font-bold transition-colors ${
                  activeCodeTab === tab
                    ? 'bg-[#002147] text-amber-400'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}.py
              </button>
            ))}
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[340px] leading-relaxed border border-slate-700">
            {activeCodeTab === 'models' && (
              <code>{`# django_backend/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class LaboratoryBlock(models.Model):
    block_code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    building = models.CharField(max_length=100)
    total_rooms = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, default='Active')

class LaboratoryRoom(models.Model):
    block = models.ForeignKey(LaboratoryBlock, on_delete=models.CASCADE, related_name='rooms')
    room_code = models.CharField(max_length=30, unique=True)
    room_name = models.CharField(max_length=150)
    lab_type = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField(default=30)

class ARAUser(models.Model):
    ara_code = models.CharField(max_length=20, unique=True) # e.g. ARA-001
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    max_weekly_hours = models.PositiveIntegerField(default=12)
    status = models.CharField(max_length=20, default='Active')

class ARABlockResponsibility(models.Model):
    block = models.ForeignKey(LaboratoryBlock, on_delete=models.CASCADE)
    ara = models.ForeignKey(ARAUser, on_delete=models.CASCADE)
    is_mandatory = models.BooleanField(default=False) # Section 14
    academic_year = models.CharField(max_length=20)
    semester = models.CharField(max_length=20)`}</code>
            )}

            {activeCodeTab === 'serializers' && (
              <code>{`# django_backend/serializers.py
from rest_framework import serializers
from .models import LaboratoryBlock, ScheduledSession, AssistantAssignment

class ScheduledSessionSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    room_code = serializers.CharField(source='room.room_code', read_only=True)

    class Meta:
        model = ScheduledSession
        fields = '__all__'

class AssistantAssignmentSerializer(serializers.ModelSerializer):
    ara_code = serializers.CharField(source='ara.ara_code', read_only=True)

    class Meta:
        model = AssistantAssignment
        fields = '__all__'`}</code>
            )}

            {activeCodeTab === 'views' && (
              <code>{`# django_backend/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class ScheduledSessionViewSet(viewsets.ModelViewSet):
    queryset = ScheduledSession.objects.all()
    serializer_class = ScheduledSessionSerializer

    @action(detail=False, methods=['post'], url_path='run-batch-assignment')
    def run_batch_assignment(self, request):
        # Executes Section 19 Batch Assignment Engine
        return Response({
            'status': 'success',
            'assigned_count': 14,
            'unresolved_count': 1
        })`}</code>
            )}

            {activeCodeTab === 'assignment_engine' && (
              <code>{`# django_backend/services/assignment_engine.py
class HardConstraintChecker:
    @staticmethod
    def evaluate(ara, session, active_qualifications, existing_assignments, availabilities, max_workload=12):
        violations = []
        if ara.status != 'Active':
            violations.append("Status not Active")
        if not is_qualified(ara, session.course):
            violations.append("Not qualified per Section 5")
        if not is_available(ara, session):
            violations.append("Timetable/availability conflict")
        return len(violations) == 0, violations`}</code>
            )}

            {activeCodeTab === 'urls' && (
              <code>{`# django_backend/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'blocks', LaboratoryBlockViewSet)
router.register(r'sessions', ScheduledSessionViewSet)
router.register(r'preferences', PreferenceSubmissionViewSet)
router.register(r'overrides', AssignmentOverrideViewSet)
router.register(r'weights', WeightConfigurationViewSet)

urlpatterns = [path('api/v1/', include(router.urls))]`}</code>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
