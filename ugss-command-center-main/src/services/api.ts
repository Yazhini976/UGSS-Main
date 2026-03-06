// API Service for UGSS Command Center Backend
// Base URL for the backend API (Docker Compose backend runs on port 8080)
const API_BASE_URL = 'http://localhost:8082/api';

// ==========================================
// USER API
// ==========================================

export const getUserByMobile = async (mobile: string) => {
  const response = await fetch(`${API_BASE_URL}/users/mobile?mobile=${mobile}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

export const getUsersByRole = async (role: string) => {
  const response = await fetch(`${API_BASE_URL}/users/role?role=${role}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

// ==========================================
// STATION API
// ==========================================

export const getAllStations = async () => {
  const response = await fetch(`${API_BASE_URL}/stations`);
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
};

export const getStationsByType = async (type: string) => {
  const response = await fetch(`${API_BASE_URL}/stations/type?type=${type}`);
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
};

export const getEquipmentByStation = async (stationId: number) => {
  const response = await fetch(`${API_BASE_URL}/equipment?station_id=${stationId}`);
  if (!response.ok) throw new Error('Failed to fetch equipment');
  return response.json();
};

// ==========================================
// COMPLAINT API
// ==========================================

export const getComplaintsByWard = async (ward: string) => {
  const response = await fetch(`${API_BASE_URL}/complaints/ward?ward=${ward}`);
  if (!response.ok) throw new Error('Failed to fetch complaints');
  return response.json();
};

export const getComplaintsByStatus = async (status: string) => {
  const response = await fetch(`${API_BASE_URL}/complaints/status?status=${status}`);
  if (!response.ok) throw new Error('Failed to fetch complaints');
  return response.json();
};

export const getComplaintStats = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/complaints/stats?date=${date}` : `${API_BASE_URL}/complaints/stats`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch complaint stats');
  return response.json();
};

export const getComplaintTypeStats = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/complaints/type-stats?date=${date}` : `${API_BASE_URL}/complaints/type-stats`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch complaint type stats');
  return response.json();
};

// ==========================================
// WORK ORDER API
// ==========================================

export const getWorkOrdersByStaff = async (staffId: number) => {
  const response = await fetch(`${API_BASE_URL}/work-orders/staff?staff_id=${staffId}`);
  if (!response.ok) throw new Error('Failed to fetch work orders');
  return response.json();
};

// ==========================================
// FAULT API
// ==========================================

export const getFaultsByStation = async (stationId: number) => {
  const response = await fetch(`${API_BASE_URL}/faults/station?station_id=${stationId}`);
  if (!response.ok) throw new Error('Failed to fetch faults');
  return response.json();
};

export const getPendingFaults = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/faults/pending?date=${date}` : `${API_BASE_URL}/faults/pending`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch pending faults');
  return response.json();
};

export const getStationCounts = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/station-counts`);
  if (!response.ok) throw new Error('Failed to fetch station counts');
  return response.json();
};

export const getComplaints = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/complaints?date=${date}` : `${API_BASE_URL}/complaints`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch complaints');
  return response.json();
};

export const getWorkOrders = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/work-orders?date=${date}` : `${API_BASE_URL}/work-orders`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch work orders');
  return response.json();
};

export const getLiftingLogs = async (stationId: number, date?: string) => {
  const url = date ? `${API_BASE_URL}/logs/lifting?station_id=${stationId}&date=${date}` : `${API_BASE_URL}/logs/lifting?station_id=${stationId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch lifting logs');
  return response.json();
};

export const getPumpingLogs = async (stationId: number, date?: string) => {
  const url = date ? `${API_BASE_URL}/logs/pumping?station_id=${stationId}&date=${date}` : `${API_BASE_URL}/logs/pumping?station_id=${stationId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch pumping logs');
  return response.json();
};

export const getSTPLogs = async (stationId: number, date?: string) => {
  const url = date ? `${API_BASE_URL}/logs/stp?station_id=${stationId}&date=${date}` : `${API_BASE_URL}/logs/stp?station_id=${stationId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch STP logs');
  return response.json();
};

export const getEnergyTrend = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/energy/trend?date=${date}` : `${API_BASE_URL}/energy/trend`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch energy trend');
  return response.json();
};


export const getSLATrend = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/sla/trend?date=${date}` : `${API_BASE_URL}/sla/trend`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch SLA trend');
  return response.json();
};

export const getOfficerStats = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/officer-stats`);
  if (!response.ok) throw new Error('Failed to fetch officer stats');
  return response.json();
};
