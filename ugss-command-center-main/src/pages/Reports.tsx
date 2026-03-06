import { useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  getComplaints,
  getWorkOrders,
  getAllStations
} from '@/services/api';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ===================== DOWNLOAD HELPER ===================== */
const downloadCSV = (filename: string, rows: any[]) => {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv =
    headers.join(',') +
    '\n' +
    rows
      .map(row =>
        headers.map(h => `"${row[h] ?? ''}"`).join(',')
      )
      .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
/* =========================================================== */
/* ===================== PDF DOWNLOAD ===================== */
const handleDownloadPDF = async () => {
  const reportElement = document.getElementById('reports-content');
  if (!reportElement) {
    alert('Report content not found');
    return;
  }

  const canvas = await html2canvas(reportElement, {
    scale: 2,
    backgroundColor: '#ffffff',
    ignoreElements: (element) => {
      // Ignore recharts SVGs
      return element.tagName === 'svg';
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = pdfHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft > 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save('UGSS_Reports.pdf');
};

/* ======================================================= */


const COLORS = [
  'hsl(215, 80%, 45%)',
  'hsl(175, 60%, 45%)',
  'hsl(38, 95%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(0, 75%, 55%)',
];

export default function Reports() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cData, woData, sData] = await Promise.all([
          getComplaints(),
          getWorkOrders(),
          getAllStations()
        ]);
        setComplaints(cData || []);
        setWorkOrders(woData || []);
        setStations(sData || []);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Derived Chart Data ---

  // 1. Complaints by Ward
  const complaintsByWard = useMemo(() => {
    const map: Record<string, number> = {};
    complaints.forEach(c => {
      const w = c.ward_number ? `Ward ${c.ward_number}` : 'Unknown';
      map[w] = (map[w] || 0) + 1;
    });
    return Object.entries(map).map(([ward, count]) => ({ ward, count }));
  }, [complaints]);

  // 2. Complaints by Type
  const complaintsByType = useMemo(() => {
    const types = ['Blockage', 'Overflow', 'Leakage'];
    const map: Record<string, number> = {};
    types.forEach(t => map[t] = 0);
    map['Other'] = 0;

    complaints.forEach(c => {
      const t = c.type || c.category || 'Other';
      if (types.includes(t)) {
        map[t] = (map[t] || 0) + 1;
      } else {
        map['Other'] = (map['Other'] || 0) + 1;
      }
    });

    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [complaints]);

  // 3. Repeat Complaints (Mock proxy: if description contains 'repeat' or random for now as DB doesn't track it explicitly yet)
  // Actually, let's just group by citizen_user_id > 1 check
  const repeatData = useMemo(() => {
    const map: Record<string, number> = {};
    complaints.forEach(c => {
      if (c.status === 'Reopened') {
        const w = c.ward_number ? `Ward ${c.ward_number}` : 'Unknown';
        map[w] = (map[w] || 0) + 1;
      }
    });
    return Object.entries(map).map(([ward, count]) => ({ ward, count }));
  }, [complaints]);

  // 4. Team Ranking (from Work Orders)
  const teamRanking = useMemo(() => {
    const staffMap: Record<number, { name: string, assigned: number, resolved: number }> = {};
    workOrders.forEach(wo => {
      if (!staffMap[wo.staff_id]) {
        staffMap[wo.staff_id] = { name: `Staff ${wo.staff_id}`, assigned: 0, resolved: 0 };
      }
      staffMap[wo.staff_id].assigned++;
      if (wo.status === 'Completed' || wo.status === 'Resolved') {
        staffMap[wo.staff_id].resolved++;
      }
    });

    return Object.values(staffMap).map(s => ({
      name: s.name,
      score: s.assigned > 0 ? Math.round((s.resolved / s.assigned) * 100) : 0,
      compliance: 90, // Placeholder
      resolved: s.resolved,
    })).sort((a, b) => b.score - a.score).slice(0, 10);
  }, [workOrders]);

  // 5. Satisfaction (Mock for now as feedbacks table isn't joined yet, or random distribution based on ID)
  const satisfactionData = [
    { rating: '5 Stars', count: Math.floor(complaints.length * 0.4) },
    { rating: '4 Stars', count: Math.floor(complaints.length * 0.3) },
    { rating: '3 Stars', count: Math.floor(complaints.length * 0.15) },
    { rating: '2 Stars', count: Math.floor(complaints.length * 0.1) },
    { rating: '1 Star', count: Math.floor(complaints.length * 0.05) },
  ];

  // 6. Energy Trend (Mock / Derived)
  const energyTrend = [
    { day: 'Mon', lifting: 400, pumping: 240, stp: 240 },
    { day: 'Tue', lifting: 300, pumping: 139, stp: 221 },
    { day: 'Wed', lifting: 200, pumping: 980, stp: 229 },
    { day: 'Thu', lifting: 278, pumping: 390, stp: 200 },
    { day: 'Fri', lifting: 189, pumping: 480, stp: 218 },
    { day: 'Sat', lifting: 239, pumping: 380, stp: 250 },
    { day: 'Sun', lifting: 349, pumping: 430, stp: 210 },
  ];

  const slaTrend = [
    { day: 'Mon', compliance: 92, breached: 2 },
    { day: 'Tue', compliance: 88, breached: 5 },
    { day: 'Wed', compliance: 95, breached: 1 },
    { day: 'Thu', compliance: 90, breached: 3 },
    { day: 'Fri', compliance: 94, breached: 2 },
  ];

  const monsoonRiskData = [
    { zone: 'Zone 1', risk: 35, complaints: 28 },
    { zone: 'Zone 2', risk: 65, complaints: 42 },
    { zone: 'Zone 3', risk: 45, complaints: 35 },
  ];

  /* ========== DOWNLOAD ALL REPORTS ========= */
  const handleDownloadAllReports = () => {
    downloadCSV('complaints.csv', complaints);
    downloadCSV('complaints_by_ward.csv', complaintsByWard);
    downloadCSV('complaints_by_type.csv', complaintsByType);
    downloadCSV('team_performance.csv', teamRanking);
    downloadCSV('citizen_satisfaction.csv', satisfactionData);
  };
  /* ======================================== */

  if (loading) return <DashboardLayout title="Reports">Loading...</DashboardLayout>;

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Comprehensive system analytics and insights"
    >
      {/* Download Reports Button */}
      <div className="mb-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleDownloadAllReports}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          ⬇ Download CSV
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90"
        >
          ⬇ Download PDF
        </button>
      </div>




      <div id="reports-content">

        <Tabs defaultValue="complaints">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="complaints">Complaints Analysis</TabsTrigger>
            <TabsTrigger value="sla">SLA Performance</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="energy">Energy Analysis</TabsTrigger>
            <TabsTrigger value="satisfaction">Citizen Satisfaction</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          </TabsList>


          <TabsContent value="complaints">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Ward-wise Complaint Distribution</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={complaintsByWard} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="ward" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Complaint Type Distribution</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <StandardPieChart
                    data={complaintsByType}
                    dataKey="count"
                    nameKey="type"
                    tooltipFormatter={(value: number) => `${value} Complaints`}
                  />
                </ResponsiveContainer>
              </div>

              <div className="chart-container lg:col-span-2">
                <h4 className="mb-4 font-semibold">Repeat Complaints by Ward</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={repeatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="ward" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" name="Repeat Complaints" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sla">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="chart-container">
                <h4 className="mb-4 font-semibold">SLA Compliance Trend</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={slaTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="compliance"
                      name="Compliance %"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4 className="mb-4 font-semibold">SLA Breaches Trend</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={slaTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="breached"
                      name="Breached"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--destructive))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Team Performance Ranking</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={teamRanking} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="score" name="Score" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="compliance" name="SLA %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Complaints Resolved by Team</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={teamRanking}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="resolved" name="Resolved" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="energy">
            <div className="chart-container">
              <h4 className="mb-4 font-semibold">Energy Consumption by Station Type</h4>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={energyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="lifting"
                    stackId="1"
                    name="Lifting Stations"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="pumping"
                    stackId="1"
                    name="Pumping Stations"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="stp"
                    stackId="1"
                    name="STP"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Citizen Satisfaction Ratings</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={satisfactionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" name="Responses" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Rating Distribution</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <StandardPieChart
                    data={satisfactionData.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="rating"
                    tooltipFormatter={(value: number) => `${value} Responses`}
                  />
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Monsoon Risk Assessment by Zone</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={monsoonRiskData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="zone" tick={{ fontSize: 14 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Radar
                      name="Risk Score"
                      dataKey="risk"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive))"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Complaints"
                      dataKey="complaints"
                      stroke="hsl(var(--warning))"
                      fill="hsl(var(--warning))"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4 className="mb-4 font-semibold">Zone Risk Comparison</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monsoonRiskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="zone" tick={{ fontSize: 14 }} />
                    <YAxis tick={{ fontSize: 14 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="risk" name="Risk Score" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="complaints" name="Complaints" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
