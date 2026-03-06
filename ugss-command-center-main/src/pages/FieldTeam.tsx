import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { getUsersByRole, getWorkOrders } from '@/services/api';
import {
  HardHat,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function FieldTeam() {
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

  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Officer name mapping for a professional look
  const OFFICER_NAMES: Record<string, string> = {
    'da0be945-6d0b-4733-99eb-2eeace7d7f68': 'Field Officer 1',
    'a69651a7-c2a2-48bc-9df2-025ec007cb56': 'Field Officer 2',
    'aa1ebc25-5b07-4145-9687-56cfe92228e8': 'Field Officer 3',
    'a7f9568c-3e6f-4763-87dc-3b6fd5660cc6': 'Field Officer 4',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [staffData, workOrders] = await Promise.all([
          getUsersByRole('FIELD_OFFICER'),
          getWorkOrders(selectedDate)
        ]);

        // Process staff metrics based on real work orders
        const processedOfficers = (staffData || []).map((staff: any) => {
          const staffWOs = (workOrders || []).filter((wo: any) => wo.staff_id === staff.id);
          const totalAssigned = staffWOs.length;
          const completed = staffWOs.filter((wo: any) => wo.status === 'Completed' || wo.status === 'Resolved').length;
          const open = totalAssigned - completed;

          // Calculate SLA compliance (mock logic for demo if dates aren't perfect)
          const slaBreached = staffWOs.filter((wo: any) => {
            if (!wo.sla_deadline || !wo.resolved_at) return false;
            return new Date(wo.resolved_at) > new Date(wo.sla_deadline);
          }).length;

          const compliantCount = completed - slaBreached;
          const slaCompliancePercent = completed > 0
            ? Math.round((compliantCount / completed) * 100)
            : 100;

          // Score calculation: 50% completion rate + 50% SLA compliance
          const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;
          const score = Math.round((completionRate * 0.5) + (slaCompliancePercent * 0.5));

          return {
            id: staff.id,
            name: OFFICER_NAMES[staff.id] || staff.full_name || staff.username,
            designation: 'Field Officer',
            status: 'Active', // Default
            currentWard: staff.ward_number || (
              staff.id === 'da0be945-6d0b-4733-99eb-2eeace7d7f68' ? '1-10' :
                staff.id === 'a69651a7-c2a2-48bc-9df2-025ec007cb56' ? '11-20' :
                  staff.id === 'aa1ebc25-5b07-4145-9687-56cfe92228e8' ? '21-30' :
                    staff.id === 'a7f9568c-3e6f-4763-87dc-3b6fd5660cc6' ? '31-42' : 'N/A'
            ),
            phone: staff.mobile_number,
            totalAssigned,
            openComplaints: open, // Using open complaints as proxy for open work orders
            inProgress: staffWOs.filter((wo: any) => wo.status === 'In Progress' || wo.status === 'WIP').length,
            avgResolutionTime: '4.2h', // Mock for now, requires complex date diff
            slaCompliancePercent,
            slaViolated: slaBreached,
            score: score || 85 // Default good score if no data
          };
        });

        // specific mock override if list is empty to show something? 
        // No, let's rely on seed data. Seed data has 20 field_staff (100 users / 5).
        setOfficers(processedOfficers);

      } catch (err) {
        console.error('Failed to fetch field team data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const activeOfficers = officers.filter((o) => o.status === 'Active');
  const totalAssigned = officers.reduce((sum, o) => sum + o.totalAssigned, 0);
  const totalOpen = officers.reduce((sum, o) => sum + o.openComplaints, 0);
  const avgCompliance = activeOfficers.length > 0
    ? Math.round(activeOfficers.reduce((sum, o) => sum + o.slaCompliancePercent, 0) / activeOfficers.length)
    : 100;

  const performanceData = activeOfficers.map((o) => ({
    name: o.name.replace('Field ', ''),
    score: o.score,
    compliance: o.slaCompliancePercent,
    resolved: o.totalAssigned - o.openComplaints - o.inProgress,
  }));

  const officerColumns = [
    { key: 'name', header: 'Name' },
    { key: 'currentWard', header: 'Ward' },
    { key: 'status', header: 'Status', render: (o: any) => <StatusBadge status={o.status} /> },
    { key: 'totalAssigned', header: 'Assigned' },
    { key: 'openComplaints', header: 'Open' },
    {
      key: 'sla',
      header: 'SLA %',
      render: (o: any) => (
        <span className={`font-bold ${o.slaCompliancePercent >= 90 ? 'text-green-600' : 'text-red-600'}`}>
          {o.slaCompliancePercent}%
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (o: any) => <GaugeChart value={o.score} label="" size="sm" />,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Field Team" subtitle="Loading...">
        <div className="flex h-64 items-center justify-center">Loading team data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Field Team" subtitle={`Workforce management and performance tracking • ${selectedDate}`}>
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Officers"
          value={activeOfficers.length}
          icon={<HardHat className="h-5 w-5" />}
        />
        <KPICard
          title="Total Assigned"
          value={totalAssigned}
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Pending Tasks"
          value={totalOpen}
          icon={<Clock className="h-5 w-5" />}
          variant={totalOpen > 10 ? 'warning' : 'success'}
        />
        <KPICard
          title="Avg SLA Compliance"
          value={`${avgCompliance}%`}
          icon={<Award className="h-5 w-5" />}
          variant={avgCompliance >= 90 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Performance Radar */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Top Performers Analysis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={90} data={performanceData.slice(0, 5)}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Performance Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints vs Resolved */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Workload vs Resolution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="score" name="Score" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compliance" name="SLA %" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Table */}
      <div>
        <h4 className="mb-4 font-semibold">Field Officers List</h4>
        <DataTable data={officers} columns={officerColumns} maxHeight="400px" />
      </div>
    </DashboardLayout>
  );
}
