import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { getComplaints as fetchAllComplaints } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Ban,
  Image,
  Mic,
  Star,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* --------- Types matching backend JSON --------- */
interface DBComplaint {
  id: number;
  citizen_user_id: number | null;
  citizen_name: string | null;
  citizen_role: string | null;
  ward_number: string | null;
  street_name: string | null;
  door_number: string | null;
  landmark: string | null;
  category: string | null;
  type: string | null;
  area_type: string | null;
  photo_url: string | null;
  audio_url: string | null;
  status: string;
  assigned_to: number | null;
  created_at: string;
  expected_resolution_at: string | null;
  resolved_at: string | null;
}

/* --------- Derived UI Complaint --------- */
interface UIComplaint extends DBComplaint {
  fullName: string;
  wardNumber: string;
  slaBreached: boolean;
  slaRemaining: number;
  hasPhoto: boolean;
  hasAudio: boolean;
  financialHold: boolean;
  repeatComplaint: boolean;
  escalationLevel: string | null;
  serviceRating: number | null;
}

function deriveUIComplaint(c: DBComplaint): UIComplaint {
  const now = new Date();
  const created = new Date(c.created_at);
  const expectedResolution = c.expected_resolution_at ? new Date(c.expected_resolution_at) : null;

  let slaRemaining = 24; // default hours
  let slaBreached = false;

  if (expectedResolution) {
    const hoursLeft = (expectedResolution.getTime() - now.getTime()) / (1000 * 60 * 60);
    slaRemaining = Math.round(hoursLeft);
    slaBreached = hoursLeft < 0 && c.status !== 'Resolved';
  }

  return {
    ...c,
    fullName: c.citizen_name || 'Anonymous',
    wardNumber: c.ward_number || '-',
    slaBreached,
    slaRemaining,
    hasPhoto: !!c.photo_url,
    hasAudio: !!c.audio_url,
    financialHold: false,           // Not tracked in DB yet
    repeatComplaint: false,         // Not tracked in DB yet
    escalationLevel: null,          // Not tracked in DB yet
    serviceRating: null,            // Needs feedback table join
  };
}

export default function Citizen() {
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0]
  );

  // Sync with Header calendar
  useEffect(() => {
    const handleStorage = () => {
      const date = localStorage.getItem('selectedDate');
      if (date) setSelectedDate(date);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [rawComplaints, setRawComplaints] = useState<DBComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all');

  const OFFICER_WARDS: Record<string, string[]> = {
    'fieldofficer1': Array.from({ length: 10 }, (_, i) => String(i + 1)),
    'fieldofficer2': Array.from({ length: 10 }, (_, i) => String(i + 11)),
    'fieldofficer3': Array.from({ length: 10 }, (_, i) => String(i + 21)),
    'fieldofficer4': Array.from({ length: 12 }, (_, i) => String(i + 31)),
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAllComplaints(selectedDate);
        setRawComplaints(data || []);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setRawComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  /* ✅ Derive UI complaints from DB complaints */
  const complaints = useMemo(() => rawComplaints.map(deriveUIComplaint), [rawComplaints]);

  /* ---- Charts ---- */
  const complaintsByWard = useMemo(() => {
    const map: Record<string, number> = {};
    const officerWards = selectedOfficer === 'all' ? null : (OFFICER_WARDS[selectedOfficer] || []);

    if (officerWards) {
      // Pre-populate only the selected officer's wards
      officerWards.forEach(w => {
        map[w] = 0;
      });
    }

    complaints.forEach(c => {
      const ward = c.ward_number || '-';
      const normalizedWard = ward.replace('Ward ', '').trim();

      if (officerWards && !officerWards.includes(normalizedWard)) return;

      map[normalizedWard] = (map[normalizedWard] || 0) + 1;
    });

    return Object.entries(map)
      .map(([ward, count]) => ({ ward: `Ward ${ward}`, count }))
      .sort((a, b) => {
        const wardA = parseInt(a.ward.replace('Ward ', ''));
        const wardB = parseInt(b.ward.replace('Ward ', ''));
        return wardA - wardB;
      });
  }, [complaints, selectedOfficer]);

  const complaintsByType = useMemo(() => {
    const map: Record<string, number> = {};
    const officerWards = selectedOfficer === 'all' ? null : (OFFICER_WARDS[selectedOfficer] || []);

    const filtered = complaints.filter(c => {
      if (!officerWards) return true;
      const ward = (c.ward_number || '').replace('Ward ', '').trim();
      return officerWards.includes(ward);
    });

    filtered.forEach(c => {
      const t = c.type || 'Other';
      map[t] = (map[t] || 0) + 1;
    });

    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [complaints, selectedOfficer]);

  /* ---- Officer Filtered Complaints ---- */
  const officerFilteredComplaints = useMemo(() => {
    const officerWards = selectedOfficer === 'all' ? null : (OFFICER_WARDS[selectedOfficer] || []);
    return complaints.filter(c => {
      if (!officerWards) return true;
      const ward = (c.ward_number || '').replace('Ward ', '').trim();
      return officerWards.includes(ward);
    });
  }, [complaints, selectedOfficer]);

  /* ---- Tab Filter ---- */
  const filteredComplaints = useMemo(() => {
    let data = [...officerFilteredComplaints];
    if (activeTab === 'completed') data = data.filter(c => c.status === 'Resolved');
    if (activeTab === 'pending') data = data.filter(c => c.status !== 'Resolved');
    if (activeTab === 'breached') data = data.filter(c => c.slaBreached);
    if (activeTab === 'financial-hold') data = data.filter(c => c.financialHold);
    if (activeTab === 'escalated') data = data.filter(c => !!c.escalationLevel);
    if (activeTab === 'repeat') data = data.filter(c => c.repeatComplaint);
    return data;
  }, [officerFilteredComplaints, activeTab]);

  /* ---- KPI Counts (Filtered by Officer) ---- */
  const totalCount = officerFilteredComplaints.length;
  const resolvedCount = officerFilteredComplaints.filter(c => c.status === 'Resolved').length;
  const pendingCount = officerFilteredComplaints.filter(c => c.status !== 'Resolved').length;
  const slaBreachedCount = officerFilteredComplaints.filter(c => c.slaBreached).length;
  const financialHoldCount = officerFilteredComplaints.filter(c => c.financialHold).length;
  const repeatCount = officerFilteredComplaints.filter(c => c.repeatComplaint).length;

  /* ---- Table Columns ---- */
  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (c: UIComplaint) => <span className="font-mono text-xs">{c.id}</span>,
    },
    {
      key: 'ward',
      header: 'Ward',
      render: (c: UIComplaint) => <Badge variant="outline">Ward {c.wardNumber}</Badge>,
    },
    { key: 'fullName', header: 'Citizen' },
    {
      key: 'type',
      header: 'Type',
      render: (c: UIComplaint) => (
        <div>
          <p className="font-medium">{c.type || '-'}</p>
          <p className="text-xs text-muted-foreground">{c.category || '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: UIComplaint) => <StatusBadge status={c.status} />,
    },
    {
      key: 'assigned',
      header: 'Assigned To',
      render: (c: UIComplaint) => (
        c.assigned_to ? <span>Staff #{c.assigned_to}</span> : <span className="text-muted-foreground">Unassigned</span>
      ),
    },
    {
      key: 'escalation',
      header: 'Escalation',
      render: (c: UIComplaint) =>
        c.escalationLevel ? (
          <Badge variant="destructive">Escalated to {c.escalationLevel}</Badge>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (c: UIComplaint) =>
        c.slaBreached ? (
          <span className="text-destructive">
            {Math.abs(c.slaRemaining)}h overdue
          </span>
        ) : (
          <span className={c.slaRemaining <= 2 ? 'text-warning' : 'text-success'}>
            {c.slaRemaining}h left
          </span>
        ),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (c: UIComplaint) => (
        <div className="flex gap-1">
          {c.financialHold && <Ban className="h-4 w-4 text-destructive" />}
          {c.repeatComplaint && <RefreshCcw className="h-4 w-4 text-warning" />}
          {c.hasPhoto && <Image className="h-4 w-4" />}
          {c.hasAudio && <Mic className="h-4 w-4" />}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (c: UIComplaint) =>
        c.serviceRating ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            {c.serviceRating}/5
          </div>
        ) : '-',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Citizen Grievance Dashboard" subtitle="Loading...">
        <div className="flex h-64 items-center justify-center">Loading complaints...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Citizen Grievance Dashboard" subtitle={`Manage and track complaints • ${selectedDate}`}>
      {/* KPI */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KPICard title="Total" value={totalCount} icon={<Users />} />
        <KPICard title="Resolved" value={resolvedCount} variant="success" icon={<CheckCircle2 />} />
        <KPICard title="Pending" value={pendingCount} variant="warning" icon={<Clock />} />
        <KPICard title="SLA Breached" value={slaBreachedCount} variant="danger" icon={<AlertTriangle />} />
        <KPICard title="Financial Hold" value={financialHoldCount} variant="danger" icon={<Ban />} />
        <KPICard title="Repeat" value={repeatCount} variant="warning" icon={<RefreshCcw />} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Bar Chart – Complaints by Ward */}
        <div className="chart-container">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Complaints by Ward</h3>
            <div className="w-[200px]">
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Field Officers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Field Officers</SelectItem>
                  <SelectItem value="fieldofficer1">Field Officer 1 (1-10)</SelectItem>
                  <SelectItem value="fieldofficer2">Field Officer 2 (11-20)</SelectItem>
                  <SelectItem value="fieldofficer3">Field Officer 3 (21-30)</SelectItem>
                  <SelectItem value="fieldofficer4">Field Officer 4 (31-42)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={complaintsByWard} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 14 }} />
              <YAxis
                type="category"
                dataKey="ward"
                width={80}
                interval={0}
                fontSize={14}
              />
              <Tooltip
                contentStyle={{ fontSize: '14px' }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart – Complaint Types */}
        <div className="chart-container">
          <h3 className="mb-4 font-semibold">Complaints by Type</h3>
          <StandardPieChart
            data={complaintsByType}
            dataKey="count"
            nameKey="type"
            tooltipFormatter={(value: number) => `${value} Complaints`}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="breached">SLA Breached</TabsTrigger>
          <TabsTrigger value="financial-hold">Financial Hold</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
          <TabsTrigger value="repeat">Repeat</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable data={filteredComplaints} columns={columns} maxHeight="none" />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
