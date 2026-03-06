import { useMemo, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import {
  getComplaintStats,
  getComplaintTypeStats,
  getAllStations,
  getPendingFaults,
  getStationCounts,
  getSLATrend,
  getEnergyTrend,
  getOfficerStats,
} from '@/services/api';
import {
  generateSTPData,
  CONFIG,
} from '@/data/mockData';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Droplets,
  Factory,
  HardHat,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = [
  'hsl(215, 80%, 45%)',
  'hsl(175, 60%, 45%)',
  'hsl(38, 95%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 55%)', // Purple for Others
];

export default function Overview() {
  /* =======================
     DATE HANDLING (NEW)
     ======================= */
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('selectedDate') ||
    new Date().toISOString().split('T')[0]
  );

  // Sync with Header changes
  useEffect(() => {
    const handleStorage = () => {
      const date = localStorage.getItem('selectedDate');
      if (date) setSelectedDate(date);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /* =======================
     REAL DATA STATE
     ======================= */
  const [complaintStats, setComplaintStats] = useState<Record<string, number>>({});
  const [complaintTypeStats, setComplaintTypeStats] = useState<Record<string, number>>({});
  const [stations, setStations] = useState<any[]>([]);
  const [stationCounts, setStationCounts] = useState<{ lifting: number, pumping: number, stp: number } | null>(null);
  const [pendingFaultsList, setPendingFaultsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slaTrend, setSlaTrend] = useState<any[]>([]);
  const [energyTrend, setEnergyTrend] = useState<any[]>([]);
  const [officerStats, setOfficerStats] = useState<any[]>([]);



  const [allTimeStats, setAllTimeStats] = useState<{ complaints: number, faults: number }>({ complaints: 0, faults: 0 });

  /* =======================
     FETCH DATA (DATE AWARE)
     ======================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          statsData,
          typeData,
          stationsData,
          faultsData,
          countsData,
          allTimeComplaints,
          allTimeFaults,
          slaData,
          energyData,
          officerData
        ] = await Promise.all([
          getComplaintStats(selectedDate),
          getComplaintTypeStats(selectedDate),
          getAllStations(),
          getPendingFaults(selectedDate),
          getStationCounts(),
          getComplaintStats(), // No date = all time
          getPendingFaults(),  // No date = all time
          getSLATrend(selectedDate),
          getEnergyTrend(selectedDate),
          getOfficerStats(),
        ]);

        setComplaintStats(statsData || {});
        setComplaintTypeStats(typeData || {});
        setStations(stationsData || []);
        setPendingFaultsList(faultsData || []);
        setStationCounts(countsData);
        setSlaTrend(slaData || []);
        setEnergyTrend(energyData || []);
        setOfficerStats(officerData || []);

        // Calculate all-time totals from the untyped status object
        const totalAll = Object.values(allTimeComplaints || {}).reduce((a: any, b: any) => a + b, 0);
        setAllTimeStats({
          complaints: Number(totalAll) || 0,
          faults: (allTimeFaults || []).length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  /* =======================
     DERIVED DATA
     ======================= */
  const totalComplaints = Object.values(complaintStats).reduce((a, b) => a + b, 0);
  const resolvedCount = complaintStats['Resolved'] || 0;
  const pendingCount = totalComplaints - resolvedCount;

  const liftingStations = stations.filter((s) => s.type === 'Lifting Station' || s.type === 'lifting');
  const pumpingStations = stations.filter((s) => s.type === 'Pumping Station' || s.type === 'pumping');
  const stpStations = stations.filter((s) => s.type === 'STP' || s.type === 'stp');

  const complaintsByStatus = useMemo(() => {
    const statuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
    const map: Record<string, number> = {};
    statuses.forEach(s => map[s] = 0);
    Object.entries(complaintStats).forEach(([status, count]) => {
      map[status] = count;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [complaintStats]);

  /* =======================
     COMPLAINT TYPE (REAL)
     ======================= */
  const complaintsByType = useMemo(() => {
    return Object.entries(complaintTypeStats).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);
  }, [complaintTypeStats]);

  const complaintsByTypeDisplay = useMemo(() => {
    // Show all types instead of hardcoded grouping
    return complaintsByType.map(item => ({
      type: item.type,
      count: item.count
    }));
  }, [complaintsByType]);

  const avgSlaCompliance = useMemo(() => {
    if (officerStats.length === 0) return 100;
    return Math.round(
      officerStats.reduce((sum, f) => sum + f.sla_compliance_percent, 0) / officerStats.length
    );
  }, [officerStats]);

  const escalatedCount = pendingFaultsList.filter(
    (f) => f.escalation_required
  ).length;

  if (loading) {
    return <div className="p-8 text-center">Loading Dashboard Data...</div>;
  }

  return (
    <DashboardLayout
      title="UGSS Command Center"
      subtitle={`Dashboard data for ${selectedDate}`}
    >
      {/* System Overview Strip */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-gradient-hero p-4 text-primary-foreground">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">Total Wards:</span>
          <span className="font-bold">{CONFIG.totalWards}</span>
        </div>
        <div className="h-4 w-px bg-primary-foreground/30" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">Sewer Network:</span>
          <span className="font-bold">{CONFIG.totalSewerNetwork} km</span>
        </div>
        <div className="h-4 w-px bg-primary-foreground/30" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">Lifting Stations:</span>
          <span className="font-bold">{stationCounts?.lifting || liftingStations.length}</span>
        </div>
        <div className="h-4 w-px bg-primary-foreground/30" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">Pumping Stations:</span>
          <span className="font-bold">{stationCounts?.pumping || pumpingStations.length}</span>
        </div>
        <div className="h-4 w-px bg-primary-foreground/30" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">STP:</span>
          <span className="font-bold">{stationCounts?.stp || stpStations.length || 1}</span>
        </div>
      </div>

      {/* =======================
          KPI CARDS
          ======================= */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Daily Complaints"
          value={totalComplaints}
          subtitle={`System Total: ${allTimeStats.complaints}`}
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Resolved Today"
          value={resolvedCount}
          subtitle={`${totalComplaints > 0
            ? Math.round((resolvedCount / totalComplaints) * 100)
            : 0}% of today's total`}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
        />
        <KPICard
          title="Daily Faults"
          value={pendingFaultsList.length}
          subtitle={`System Total: ${allTimeStats.faults}`}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="danger"
        />
        <KPICard
          title="SLA Compliance"
          value={`${avgSlaCompliance}%`}
          subtitle="Average across teams"
          icon={<Clock className="h-6 w-6" />}
          variant="accent"
        />
      </div>

      {/* =======================
          CHARTS ROW 1
          ======================= */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Complaints by Type</h3>
          <StandardPieChart
            data={complaintsByTypeDisplay}
            dataKey="count"
            nameKey="type"
            tooltipFormatter={(value: number) => `${value} Complaints`}
          />
        </div>

        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Complaints by Status</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={complaintsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                contentStyle={{
                  fontSize: '14px',
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =======================
          CHARTS ROW 2
          ======================= */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">SLA Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={slaTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  fontSize: '14px',
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="compliance"
                stroke="hsl(150, 60%, 45%)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="breached"
                stroke="hsl(0, 75%, 55%)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Energy Consumption (kWh)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={energyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  fontSize: '14px',
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} iconType="circle" />
              <Area
                type="monotone"
                dataKey="lifting"
                stackId="1"
                stroke="hsl(215, 80%, 45%)"
                fill="url(#colorLifting)"
              />
              <Area
                type="monotone"
                dataKey="pumping"
                stackId="1"
                stroke="hsl(38, 95%, 55%)"
                fill="url(#colorPumping)"
              />
              <Area
                type="monotone"
                dataKey="stp"
                stackId="1"
                stroke="hsl(175, 60%, 45%)"
                fill="url(#colorStp)"
              />
              <defs>
                <linearGradient id="colorLifting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 80%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(215, 80%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPumping" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorStp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(175, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
