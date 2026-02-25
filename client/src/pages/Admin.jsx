import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiShield, FiMessageCircle, FiAlertTriangle,
  FiSearch, FiLogOut, FiTrash2, FiLock, FiUnlock,
  FiRefreshCw, FiActivity, FiUserCheck, FiUserX,
  FiClock, FiTrendingUp, FiX, FiChevronLeft, FiChevronRight,
  FiBarChart2, FiPieChart
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

// ============ CHART COMPONENTS ============

// Area Chart with gradient fill
const AreaChart = ({ data, dataKey, color = '#7c3aed', height = 200, labelKey = 'label', title, subtitle }) => {
  const svgRef = useRef(null);
  if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;

  const maxVal = Math.max(...data.map(d => d[dataKey]), 1);
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = 600;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * innerW,
    y: padding.top + innerH - (d[dataKey] / maxVal) * innerH,
    value: d[dataKey],
    label: d[labelKey]
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    value: Math.round(maxVal * f),
    y: padding.top + innerH - f * innerH
  }));

  // X-axis labels (show every Nth)
  const step = Math.max(1, Math.floor(data.length / 7));

  return (
    <div className="chart-card glass">
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${chartW} ${chartH}`} className="chart-svg">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padding.left} y1={t.y} x2={chartW - padding.right} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={t.y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="Inter, sans-serif">{t.value}</text>
          </g>
        ))}
        {/* Area */}
        <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" opacity={data[i][dataKey] > 0 ? 1 : 0.3} />
            {data[i][dataKey] > 0 && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill={color} fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">{p.value}</text>
            )}
          </g>
        ))}
        {/* X labels */}
        {data.map((d, i) => (
          i % step === 0 && (
            <text key={i} x={points[i].x} y={chartH - 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Inter, sans-serif">{d[labelKey]}</text>
          )
        ))}
      </svg>
    </div>
  );
};

// Bar Chart
const BarChart = ({ data, bars, height = 220, labelKey = 'label', title, subtitle }) => {
  if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;

  const maxVal = Math.max(...data.flatMap(d => bars.map(b => d[b.key])), 1);
  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const chartW = 600;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;
  const barGroupW = innerW / data.length;
  const barW = Math.min(barGroupW * 0.6 / bars.length, 40);
  const gap = 3;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    value: Math.round(maxVal * f),
    y: padding.top + innerH - f * innerH
  }));

  return (
    <div className="chart-card glass">
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
      )}
      <div className="chart-legend">
        {bars.map(b => (
          <div key={b.key} className="legend-item">
            <span className="legend-dot" style={{ background: b.color }} />
            <span>{b.label}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="chart-svg">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padding.left} y1={t.y} x2={chartW - padding.right} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={t.y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="Inter, sans-serif">{t.value}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const groupX = padding.left + i * barGroupW + barGroupW / 2;
          const totalBarsW = bars.length * barW + (bars.length - 1) * gap;
          const startX = groupX - totalBarsW / 2;
          return (
            <g key={i}>
              {bars.map((b, bIdx) => {
                const barH = (d[b.key] / maxVal) * innerH;
                const x = startX + bIdx * (barW + gap);
                const y = padding.top + innerH - barH;
                return (
                  <g key={b.key}>
                    <rect x={x} y={y} width={barW} height={barH} fill={b.color} rx="3" opacity="0.85" />
                    {d[b.key] > 0 && (
                      <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill={b.color} fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">{d[b.key]}</text>
                    )}
                  </g>
                );
              })}
              <text x={groupX} y={chartH - 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter, sans-serif">{d[labelKey]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Donut Chart
const DonutChart = ({ data, title, subtitle }) => {
  if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return (
    <div className="chart-card glass">
      {title && <div className="chart-header"><h3 className="chart-title">{title}</h3></div>}
      <div className="chart-empty-inner">No data yet</div>
    </div>
  );

  const cx = 100, cy = 100, r = 70, strokeW = 24;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="chart-card glass donut-chart-card">
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
      )}
      <div className="donut-wrapper">
        <svg viewBox="0 0 200 200" className="donut-svg">
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const dashOffset = -offset;
            offset += dash;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeW}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                opacity="0.85"
              />
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">{total}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="Inter, sans-serif">Total</text>
        </svg>
        <div className="donut-legend">
          {data.map((d, i) => (
            <div key={i} className="donut-legend-item">
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-label">{d.label}</span>
              <span className="legend-value" style={{ color: d.color }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Horizontal Bar Chart for simple distributions
const HorizontalBarChart = ({ data, title, subtitle }) => {
  if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="chart-card glass">
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
      )}
      <div className="hbar-list">
        {data.map((d, i) => (
          <div key={i} className="hbar-item">
            <div className="hbar-label">
              <span className="hbar-icon" style={{ color: d.color }}>{d.icon || '●'}</span>
              <span>{d.label}</span>
            </div>
            <div className="hbar-bar-wrapper">
              <motion.div
                className="hbar-bar"
                style={{ background: d.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / maxVal) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </div>
            <span className="hbar-value" style={{ color: d.color }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ MAIN ADMIN COMPONENT ============

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/chat');
      return;
    }
    fetchDashboard();
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, searchQuery, filterType]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getStats();
      setStats(data.stats);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await adminAPI.getAnalytics();
      setAnalytics(data.analytics);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const data = await adminAPI.getUsers({ page, search: searchQuery, filter: filterType });
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleBlockUser = async (userId, blockType) => {
    setActionLoading(true);
    try {
      await adminAPI.blockUser(userId, blockType, actionReason);
      toast.success(`User ${blockType === '24h' ? 'blocked for 24 hours' : 'permanently blocked'}`);
      setActionModal(null);
      setActionReason('');
      fetchUsers(usersPagination.page);
      fetchDashboard();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await adminAPI.unblockUser(userId);
      toast.success('User unblocked');
      fetchUsers(usersPagination.page);
      fetchDashboard();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(userId, actionReason);
      toast.success('User account deleted');
      setActionModal(null);
      setActionReason('');
      fetchUsers(usersPagination.page);
      fetchDashboard();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetWarnings = async (userId) => {
    try {
      await adminAPI.resetWarnings(userId);
      toast.success('Warnings reset');
      fetchUsers(usersPagination.page);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Prepare chart data from analytics
  const statusChartData = analytics ? [
    { label: 'Active', value: analytics.statusDistribution.active, color: '#10b981' },
    { label: 'Blocked 24H', value: analytics.statusDistribution.blocked24h, color: '#f59e0b' },
    { label: 'Blocked Perm', value: analytics.statusDistribution.blockedPermanent, color: '#ef4444' },
    { label: 'Deleted', value: analytics.statusDistribution.deleted, color: '#64748b' },
    { label: 'Unverified', value: analytics.statusDistribution.unverified, color: '#8b5cf6' }
  ] : [];

  const warningChartData = analytics ? [
    { label: 'Clean (0)', value: analytics.warningDistribution.clean, color: '#10b981', icon: '✅' },
    { label: 'Low (1-2)', value: analytics.warningDistribution.low, color: '#f59e0b', icon: '⚠️' },
    { label: 'Medium (3-4)', value: analytics.warningDistribution.medium, color: '#f97316', icon: '🟠' },
    { label: 'High (5+)', value: analytics.warningDistribution.high, color: '#ef4444', icon: '🔴' },
    { label: 'Typing Blocked', value: analytics.warningDistribution.typingBlocked, color: '#dc2626', icon: '🚫' }
  ] : [];

  const statCards = stats ? [
    { icon: <FiUsers />, label: 'Total Users', value: stats.totalUsers, color: '#7c3aed' },
    { icon: <FiUserCheck />, label: 'Active Users', value: stats.activeUsers, color: '#10b981' },
    { icon: <FiActivity />, label: 'Online Now', value: stats.onlineUsers, color: '#06b6d4' },
    { icon: <FiUserX />, label: 'Blocked', value: stats.blockedUsers, color: '#ef4444' },
    { icon: <FiMessageCircle />, label: 'Total Messages', value: stats.totalMessages, color: '#8b5cf6' },
    { icon: <FiAlertTriangle />, label: 'Flagged Messages', value: stats.flaggedMessages, color: '#f59e0b' },
    { icon: <FiTrendingUp />, label: 'New (7 days)', value: stats.recentSignups, color: '#3b82f6' },
    { icon: <FiTrash2 />, label: 'Deleted', value: stats.deletedAccounts, color: '#64748b' }
  ] : [];

  return (
    <div className="admin-page">
      <div className="bg-grid" />

      {/* Sidebar */}
      <aside className="admin-sidebar glass-strong">
        <div className="sidebar-header">
          <span className="sidebar-logo">🎭</span>
          <div>
            <h2 className="gradient-text">IncogniChat</h2>
            <span className="sidebar-role">Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FiActivity />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiBarChart2 />
            <span>Analytics</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers />
            <span>Users</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => navigate('/chat')}
          >
            <FiMessageCircle />
            <span>View Chat</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <AnimatePresence mode="wait">
          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-content"
            >
              <div className="content-header">
                <div>
                  <h1>Dashboard</h1>
                  <p className="content-subtitle">Overview of IncogniChat activity</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchDashboard}>
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Loading dashboard...</p>
                </div>
              ) : (
                <div className="stats-grid">
                  {statCards.map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className="stat-card glass"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                        {stat.icon}
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label-text">{stat.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== ANALYTICS TAB ===== */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-content"
            >
              <div className="content-header">
                <div>
                  <h1>Analytics</h1>
                  <p className="content-subtitle">Charts & insights for platform performance</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics}>
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>

              {analyticsLoading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="analytics-grid">
                  {/* Row 1: User Growth + Status Distribution */}
                  <div className="analytics-row">
                    <div className="analytics-col-wide">
                      <AreaChart
                        data={analytics.userGrowth}
                        dataKey="count"
                        labelKey="label"
                        color="#7c3aed"
                        height={240}
                        title="User Growth"
                        subtitle="New signups (last 30 days)"
                      />
                    </div>
                    <div className="analytics-col-narrow">
                      <DonutChart
                        data={statusChartData}
                        title="User Status"
                        subtitle="Distribution"
                      />
                    </div>
                  </div>

                  {/* Row 2: Message Activity + Warning Distribution */}
                  <div className="analytics-row">
                    <div className="analytics-col-wide">
                      <BarChart
                        data={analytics.messageActivity}
                        bars={[
                          { key: 'total', label: 'Total Messages', color: '#8b5cf6' },
                          { key: 'flagged', label: 'Flagged', color: '#ef4444' }
                        ]}
                        labelKey="label"
                        height={240}
                        title="Message Activity"
                        subtitle="Last 7 days"
                      />
                    </div>
                    <div className="analytics-col-narrow">
                      <HorizontalBarChart
                        data={warningChartData}
                        title="Warning Levels"
                        subtitle="User distribution"
                      />
                    </div>
                  </div>

                  {/* Row 3: Hourly Activity (full width) */}
                  <div className="analytics-row">
                    <div className="analytics-col-full">
                      <AreaChart
                        data={analytics.hourlyActivity}
                        dataKey="count"
                        labelKey="label"
                        color="#06b6d4"
                        height={200}
                        title="Hourly Activity"
                        subtitle="Peak usage hours (last 7 days)"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="loading-state">
                  <FiBarChart2 style={{ fontSize: 48, opacity: 0.3 }} />
                  <p>Click refresh to load analytics</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== USERS TAB ===== */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-content"
            >
              <div className="content-header">
                <div>
                  <h1>User Management</h1>
                  <p className="content-subtitle">Manage all registered users</p>
                </div>
              </div>

              {/* Filters */}
              <div className="users-filters">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search by name, email, or anonymous name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-tabs">
                  {['all', 'active', 'blocked', 'warned', 'deleted'].map(f => (
                    <button
                      key={f}
                      className={`filter-tab ${filterType === f ? 'active' : ''}`}
                      onClick={() => setFilterType(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="users-table-wrapper glass">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Anonymous Name</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Warnings</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <motion.tr
                        key={u._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="user-row"
                      >
                        <td>
                          <div className="user-cell">
                            <div className="mini-avatar" style={{ background: getAvatarColor(u.anonymousName) }}>
                              {u.anonymousName?.charAt(0)}
                            </div>
                            <span className="anon-name">{u.anonymousName}</span>
                          </div>
                        </td>
                        <td>{u.fullName}</td>
                        <td className="email-cell">{u.email}</td>
                        <td>
                          <span className={`badge ${u.warningCount > 0 ? 'badge-warning' : 'badge-success'}`}>
                            {u.warningCount}/5
                          </span>
                        </td>
                        <td>
                          {u.isDeleted ? (
                            <span className="badge badge-danger">Deleted</span>
                          ) : u.isBlocked ? (
                            <span className="badge badge-danger">
                              {u.blockType === 'permanent' ? 'Permanent' : '24H Block'}
                            </span>
                          ) : u.isOnline ? (
                            <span className="badge badge-success">Online</span>
                          ) : (
                            <span className="badge badge-info">Offline</span>
                          )}
                        </td>
                        <td className="date-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {!u.isBlocked && !u.isDeleted && (
                              <>
                                <button
                                  className="action-btn block"
                                  title="Block 24H"
                                  onClick={() => setActionModal({ type: 'block24h', user: u })}
                                >
                                  <FiClock />
                                </button>
                                <button
                                  className="action-btn block-perm"
                                  title="Block Permanently"
                                  onClick={() => setActionModal({ type: 'blockPerm', user: u })}
                                >
                                  <FiLock />
                                </button>
                              </>
                            )}
                            {u.isBlocked && !u.isDeleted && (
                              <button
                                className="action-btn unblock"
                                title="Unblock"
                                onClick={() => handleUnblockUser(u._id)}
                              >
                                <FiUnlock />
                              </button>
                            )}
                            {u.warningCount > 0 && (
                              <button
                                className="action-btn reset"
                                title="Reset Warnings"
                                onClick={() => handleResetWarnings(u._id)}
                              >
                                <FiRefreshCw />
                              </button>
                            )}
                            {!u.isDeleted && (
                              <button
                                className="action-btn delete"
                                title="Delete Account"
                                onClick={() => setActionModal({ type: 'delete', user: u })}
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="no-data">
                    <FiUsers />
                    <p>No users found</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {usersPagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={usersPagination.page <= 1}
                    onClick={() => fetchUsers(usersPagination.page - 1)}
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="page-info">
                    Page {usersPagination.page} of {usersPagination.pages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={usersPagination.page >= usersPagination.pages}
                    onClick={() => fetchUsers(usersPagination.page + 1)}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActionModal(null)}
          >
            <motion.div
              className="modal-card glass-strong"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setActionModal(null)}>
                <FiX />
              </button>
              
              <div className="modal-icon">
                {actionModal.type === 'delete' ? <FiTrash2 /> : <FiShield />}
              </div>

              <h3>
                {actionModal.type === 'delete' && 'Delete Account'}
                {actionModal.type === 'block24h' && 'Block for 24 Hours'}
                {actionModal.type === 'blockPerm' && 'Block Permanently'}
              </h3>
              <p className="modal-desc">
                This action will affect user <strong>{actionModal.user.anonymousName}</strong> ({actionModal.user.fullName}).
                An email notification will be sent to them.
              </p>

              <div className="form-group">
                <label className="form-label">Reason (optional)</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setActionModal(null)}>
                  Cancel
                </button>
                <button
                  className={`btn ${actionModal.type === 'delete' ? 'btn-danger' : 'btn-warning'}`}
                  disabled={actionLoading}
                  onClick={() => {
                    if (actionModal.type === 'delete') handleDeleteUser(actionModal.user._id);
                    else if (actionModal.type === 'block24h') handleBlockUser(actionModal.user._id, '24h');
                    else handleBlockUser(actionModal.user._id, 'permanent');
                  }}
                >
                  {actionLoading ? (
                    <><span className="spinner spinner-sm" /> Processing...</>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getAvatarColor = (name) => {
  const colors = [
    '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default Admin;
