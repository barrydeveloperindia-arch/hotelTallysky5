import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Utensils, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  RefreshCw, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  Activity, 
  AlertTriangle,
  Info,
  DollarSign
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  const [data, setData] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'audit', 'instructions', 'visual-audit'
  const [modalTab, setModalTab] = useState('sales'); // 'sales', 'food', 'expenses'
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData(false, true); // do not force reload on startup, but it is initial load
  }, []);

  const fetchData = async (force = false, initial = false) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/data?reload=${force}`);
      const json = await res.json();
      setData(json);

      // Extract all available months
      const months = new Set();
      json.rooms.forEach(r => {
        const roomObj = json.roomData[r];
        if (roomObj && roomObj.months) {
          Object.keys(roomObj.months).forEach(m => months.add(m));
        }
      });
      const sortedMonths = Array.from(months).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA; // Sort latest first
      });

      if (sortedMonths.length > 0 && initial) {
        setSelectedMonth(sortedMonths[0]);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to local server backend. Make sure the Node server is running on http://localhost:5000.");
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    setReconciling(true);
    try {
      const res = await fetch('http://localhost:5000/api/reconciliation');
      const json = await res.json();
      setReconciliation(json);
    } catch (err) {
      console.error(err);
      alert("Failed to run reconciliation check.");
    } finally {
      setReconciling(false);
    }
  };

  // Unique list of months in parsed data
  const getMonthsList = () => {
    if (!data) return [];
    const months = new Set();
    data.rooms.forEach(r => {
      const roomObj = data.roomData[r];
      if (roomObj && roomObj.months) {
        Object.keys(roomObj.months).forEach(m => months.add(m));
      }
    });
    return Array.from(months).sort((a, b) => new Date(a) - new Date(b));
  };

  // Compute stats for selected month
  const getMonthStats = () => {
    if (!data || !selectedMonth) return { roomSales: 0, foodSales: 0, expenses: 0, totalProfit: 0 };
    
    let roomSales = 0;
    let foodSales = 0;
    let expenses = 0;

    data.rooms.forEach(r => {
      const roomMonthObj = data.roomData[r]?.months[selectedMonth];
      if (roomMonthObj) {
        roomSales += roomMonthObj.totalRoomSales;
        foodSales += roomMonthObj.totalFoodSales;
        expenses += roomMonthObj.totalExpenses;
      }
    });

    return {
      roomSales,
      foodSales,
      expenses,
      totalSales: roomSales + foodSales,
      totalProfit: (roomSales + foodSales) - expenses
    };
  };

  const getFilteredRooms = () => {
    if (!data) return [];
    return data.rooms.filter(r => {
      // Filter list based on search query
      const matchSearch = r.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '40px', textAlign: 'center' }}>
        <AlertTriangle size={64} color="var(--danger)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>Server Offline</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '30px' }}>{error}</p>
        <button className="btn-primary" onClick={() => fetchData(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
          <RefreshCw size={18} /> Retry Connection
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <RefreshCw className="animate-spin" size={48} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '20px' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Loading Daybook Records...</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Scanning Excel sheets and building database</p>
      </div>
    );
  }

  const monthsList = getMonthsList();
  const stats = getMonthStats();
  const filteredRooms = getFilteredRooms();

  return (
    <div className="dashboard-container" style={{ padding: '24px 40px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.8px', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Hotel Sky 5
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Room-Wise Performance Dashboard & Reconciliation (FY 2026-2027)
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}>
            <Calendar size={18} color="var(--text-secondary)" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontWeight: '600', outline: 'none', cursor: 'pointer', fontSize: '15px' }}
            >
              {monthsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => fetchData(true)}
            className="btn-reload"
            title="Reload from Excel"
            style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '32px', gap: '24px' }}>
        <button 
          onClick={() => setActiveTab('summary')}
          style={{ paddingBottom: '12px', fontSize: '16px', fontWeight: '600', border: 'none', background: 'transparent', color: activeTab === 'summary' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'summary' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Room Wise Profitability
        </button>
        <button 
          onClick={() => { setActiveTab('audit'); runReconciliation(); }}
          style={{ paddingBottom: '12px', fontSize: '16px', fontWeight: '600', border: 'none', background: 'transparent', color: activeTab === 'audit' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'audit' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          Tally Audit Sync
        </button>
        <button 
          onClick={() => setActiveTab('visual-audit')}
          style={{ paddingBottom: '12px', fontSize: '16px', fontWeight: '600', border: 'none', background: 'transparent', color: activeTab === 'visual-audit' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'visual-audit' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Receipt size={16} /> Visual Bill Audit
        </button>
        <button 
          onClick={() => setActiveTab('instructions')}
          style={{ paddingBottom: '12px', fontSize: '16px', fontWeight: '600', border: 'none', background: 'transparent', color: activeTab === 'instructions' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'instructions' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <HelpCircle size={16} /> Data Entry Guide
        </button>
      </div>

      {activeTab === 'summary' && (
        <div className="fade-in">
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', backdropFilter: 'var(--glass-blur)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Room rent Sales</span>
                <Building size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>₹{stats.roomSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', backdropFilter: 'var(--glass-blur)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Tea & Food Sales</span>
                <Utensils size={20} color="var(--success)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>₹{stats.foodSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', backdropFilter: 'var(--glass-blur)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Room-attributed Expenses</span>
                <Receipt size={20} color="var(--danger)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>₹{stats.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', backdropFilter: 'var(--glass-blur)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Net Room Profit</span>
                {stats.totalProfit >= 0 ? <TrendingUp size={20} color="var(--success)" /> : <TrendingDown size={20} color="var(--danger)" />}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: stats.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-heading)' }}>₹{stats.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '24px', width: '100%', maxWidth: '400px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search Room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '15px' }}
            />
          </div>

          {/* Room Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {filteredRooms.map(r => {
              const rMonth = data.roomData[r]?.months[selectedMonth] || {
                totalRoomSales: 0,
                totalFoodSales: 0,
                totalExpenses: 0,
                roomSales: [],
                foodSales: [],
                expenses: []
              };
              const totalSales = rMonth.totalRoomSales + rMonth.totalFoodSales;
              const netProfit = totalSales - rMonth.totalExpenses;
              const isWalkIn = r.toLowerCase() === 'walk-in';

              return (
                <div 
                  key={r}
                  onClick={() => setSelectedRoom(r)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                      {isWalkIn ? 'Walk-in Customers' : `Room ${r}`}
                    </h3>
                    {totalSales > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '20px', background: netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {netProfit >= 0 ? 'Profitable' : 'Loss'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Room Rent:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{rMonth.totalRoomSales.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Food & Tea:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{rMonth.totalFoodSales.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Expenses:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{rMonth.totalExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Net Performance:</span>
                      <span style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{netProfit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>Tally Audit Discrepancies</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Comparing aggregates from Excel daybook with vouchers recorded in Tally (up to June 4, 2026).
              </p>
            </div>
            
            <button 
              onClick={runReconciliation}
              disabled={reconciling}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
            >
              {reconciling ? 'Checking...' : 'Re-Run Audit Check'}
            </button>
          </div>

          {reconciling && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
              <RefreshCw className="animate-spin" size={36} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '10px' }} />
              <span>Analyzing vouchers.xml and mapping totals...</span>
            </div>
          )}

          {!reconciling && reconciliation && (
            <div>
              {reconciliation.discrepanciesCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <TrendingUp size={48} color="var(--success)" style={{ marginBottom: '12px' }} />
                  <h3>All clear! No discrepancies found.</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>All sales, expenses, and receipt vouchers are matched completely.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Daybook Page</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Excel Amount</th>
                        <th style={{ padding: '12px' }}>Tally Amount</th>
                        <th style={{ padding: '12px' }}>Difference</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliation.discrepancies.map((d, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{d.date}</td>
                          <td style={{ padding: '12px' }}>{d.sheetName}</td>
                          <td style={{ padding: '12px' }}>{d.category}</td>
                          <td style={{ padding: '12px' }}>₹{d.excel.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px' }}>₹{d.tally.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px', color: d.diff > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                            {d.diff > 0 ? '+' : ''}₹{d.diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px', background: d.status.includes('Mismatched') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: d.status.includes('Mismatched') ? 'var(--warning)' : 'var(--danger)' }}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!reconciliation && !reconciling && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <Info size={40} style={{ marginBottom: '10px' }} />
              <p>Click "Re-Run Audit Check" to crosscheck Excel against Tally records.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'visual-audit' && (
        <VisualAuditView />
      )}

      {activeTab === 'instructions' && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--card-shadow)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={24} color="var(--primary)" /> How to Enter Room Sales & Food
            </h2>
            
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', lineHeight: '1.6' }}>
              <li>
                <strong>Room Sales:</strong> Enter the room number in the <code>ROOM NO.</code> column of Room Sales. If a single booking is for multiple rooms, you can write them separated by a comma (e.g. <code>16,17</code>), slash (e.g. <code>2/3</code>), or ampersand (e.g. <code>10 & 17</code>). The system will split the revenue equally among those rooms.
              </li>
              <li>
                <strong>Tea, Snacks, Food & Beverages:</strong> Write the food bill directly on the guest's check-in row! The system will check the <code>ROOM NO.</code> in Column C of that row and automatically attribute the food bill to that room.
              </li>
              <li>
                <strong>Walk-in Food Clients:</strong> If a customer is not staying in a room, write their name under <code>GUEST NAME</code>, enter the food bill details, and leave the <code>ROOM NO.</code> column empty. It will be cataloged under <em>Walk-in Customers</em>.
              </li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--card-shadow)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={24} color="var(--danger)" /> How to Enter Expenses
            </h2>
            
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', lineHeight: '1.6' }}>
              <li>
                To link an expense (material purchase, repair work, plumbing, electricity parts) to a specific room, write the room number in the <strong><code>REMARKS</code></strong> column (or the <code>PARTICULARS</code> column) of the Expenses table.
              </li>
              <li>
                <strong>Accepted Formats:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'circle' }}>
                  <li><code>Room 5</code></li>
                  <li><code>Room 101</code></li>
                  <li><code>Room No. 3</code></li>
                  <li><code>R6</code></li>
                  <li><code>R-102</code></li>
                </ul>
              </li>
              <li>
                <strong>General Hotel Expenses:</strong> If the expense is general (e.g. housekeeping salary, common area bulb, generator diesel, water tanker), leave the remarks empty or do not mention any room number. It will be treated as general expense and not allocated to any specific room.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', width: '100%', maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: 'var(--popover-shadow)', position: 'relative' }}>
            
            <button 
              onClick={() => { setSelectedRoom(null); setModalTab('sales'); }}
              style={{ position: 'absolute', right: '24px', top: '24px', border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)', outline: 'none' }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              {selectedRoom.toLowerCase() === 'walk-in' ? 'Walk-in Customers Breakdown' : `Room ${selectedRoom} Analysis`}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Detailed transaction log for <strong>{selectedMonth}</strong>
            </p>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', gap: '16px' }}>
              <button 
                onClick={() => setModalTab('sales')}
                style={{ paddingBottom: '10px', fontWeight: '600', border: 'none', background: 'transparent', color: modalTab === 'sales' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: modalTab === 'sales' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              >
                Room Bookings
              </button>
              <button 
                onClick={() => setModalTab('food')}
                style={{ paddingBottom: '10px', fontWeight: '600', border: 'none', background: 'transparent', color: modalTab === 'food' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: modalTab === 'food' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              >
                Food & Tea Services
              </button>
              <button 
                onClick={() => setModalTab('expenses')}
                style={{ paddingBottom: '10px', fontWeight: '600', border: 'none', background: 'transparent', color: modalTab === 'expenses' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: modalTab === 'expenses' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              >
                Allocated Expenses
              </button>
            </div>

            {/* Room rent transactions */}
            {modalTab === 'sales' && (
              <div>
                {(!data.roomData[selectedRoom]?.months[selectedMonth]?.roomSales || data.roomData[selectedRoom].months[selectedMonth].roomSales.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No room rent entries recorded for this room in {selectedMonth}.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px' }}>Date</th>
                          <th style={{ padding: '8px' }}>Invoice No</th>
                          <th style={{ padding: '8px' }}>Guest Name</th>
                          <th style={{ padding: '8px' }}>Mode</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Cash</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>UPI</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Card</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Treebo</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.roomData[selectedRoom].months[selectedMonth].roomSales.map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px' }}>{s.date}</td>
                            <td style={{ padding: '8px' }}>{s.invoiceNo}</td>
                            <td style={{ padding: '8px', fontWeight: '600' }}>{s.guestName}</td>
                            <td style={{ padding: '8px' }}>{s.bookingMode}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.cash.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.upi.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.card.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.treebo.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹{s.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Food/Services transactions */}
            {modalTab === 'food' && (
              <div>
                {(!data.roomData[selectedRoom]?.months[selectedMonth]?.foodSales || data.roomData[selectedRoom].months[selectedMonth].foodSales.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No food bills charged to this room in {selectedMonth}.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px' }}>Date</th>
                          <th style={{ padding: '8px' }}>Bill No</th>
                          <th style={{ padding: '8px' }}>Guest Name</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Cash</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>UPI</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Card</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Treebo Comp</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Treebo CL</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Disha Co</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.roomData[selectedRoom].months[selectedMonth].foodSales.map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px' }}>{s.date}</td>
                            <td style={{ padding: '8px' }}>{s.billNo}</td>
                            <td style={{ padding: '8px', fontWeight: '600' }}>{s.guestName}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.cash.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.upi.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.card.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.treeboComp.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.treeboCL.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.disha.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹{s.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Allocated Expenses */}
            {modalTab === 'expenses' && (
              <div>
                {(!data.roomData[selectedRoom]?.months[selectedMonth]?.expenses || data.roomData[selectedRoom].months[selectedMonth].expenses.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No maintenance expenses attributed to this room in {selectedMonth}.</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                      To attribute expenses to this room, remember to write <code>Room {selectedRoom}</code> in the Remarks column of your Expenses sheet!
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px' }}>Date</th>
                          <th style={{ padding: '8px' }}>Voucher No</th>
                          <th style={{ padding: '8px' }}>Paid To / Party</th>
                          <th style={{ padding: '8px' }}>Particulars</th>
                          <th style={{ padding: '8px' }}>Remarks</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.roomData[selectedRoom].months[selectedMonth].expenses.map((e, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px' }}>{e.date}</td>
                            <td style={{ padding: '8px' }}>{e.vchNo}</td>
                            <td style={{ padding: '8px' }}>{e.paidTo || e.partyName}</td>
                            <td style={{ padding: '8px' }}>{e.particulars}</td>
                            <td style={{ padding: '8px', color: 'var(--primary)', fontWeight: '600' }}>{e.remarks}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--danger)' }}>₹{e.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// Sub-component for Visual Bill Audit
function VisualAuditView() {
  const [manifest, setManifest] = useState([]);
  const [ocrData, setOcrData] = useState({});
  const [auditedResults, setAuditedResults] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterMode, setFilterMode] = useState('unaudited'); // default to unaudited to speed up work

  const [formData, setFormData] = useState({
    date: '',
    invoiceNo: '',
    guestName: '',
    roomNo: '',
    basic: '',
    cgst: '',
    sgst: '',
    total: '',
    phone: '',
    paymentMode: 'UPI'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [manifestRes, auditRes, ocrRes] = await Promise.all([
          fetch('/manifest.json'),
          fetch('http://localhost:5000/api/get-audit'),
          fetch('/advanced_ocr_parsed.json').then(r => r.json()).catch(() => [])
        ]);
        const manifestJson = await manifestRes.json();
        const auditJson = await auditRes.json();
        
        setManifest(manifestJson);
        setAuditedResults(auditJson);
        
        // Index OCR data by image file name
        const ocrMap = {};
        ocrRes.forEach(b => {
          ocrMap[b.fileName] = b;
        });
        setOcrData(ocrMap);
      } catch (err) {
        console.error("Error loading audit data:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getFilteredList = () => {
    if (filterMode === 'all') return manifest;
    if (filterMode === 'audited') return manifest.filter(img => auditedResults[img.id]);
    return manifest.filter(img => !auditedResults[img.id]);
  };

  const filteredList = getFilteredList();
  const currentImg = filteredList[currentIndex];

  useEffect(() => {
    if (!currentImg) return;
    setRotation(0);
    
    // Check if already audited
    if (auditedResults[currentImg.id]) {
      const audited = auditedResults[currentImg.id].data;
      setFormData({
        date: audited.date || '',
        invoiceNo: audited.invoiceNo || '',
        guestName: audited.guestName || '',
        roomNo: audited.roomNo || '',
        basic: audited.basic || '',
        cgst: audited.cgst || '',
        sgst: audited.sgst || '',
        total: audited.total || '',
        phone: audited.phone || '',
        paymentMode: audited.paymentMode || 'UPI'
      });
    } else {
      // Fallback to OCR data if available
      const ocr = ocrData[currentImg.originalName] || {};
      setFormData({
        date: ocr.date || '',
        invoiceNo: ocr.invoiceNo || '',
        guestName: ocr.guestName || '',
        roomNo: ocr.roomNo || '',
        basic: ocr.basic || '',
        cgst: ocr.cgst || '',
        sgst: ocr.sgst || '',
        total: ocr.total || '',
        phone: ocr.phone || '',
        paymentMode: ocr.paymentMode || 'UPI'
      });
    }
  }, [currentImg, auditedResults, ocrData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      // Auto-calculate CGST, SGST, and Total if basic changes
      if (name === 'basic') {
        const bVal = parseFloat(value) || 0;
        const cgstVal = parseFloat((bVal * 0.025).toFixed(2));
        const sgstVal = parseFloat((bVal * 0.025).toFixed(2));
        const totalVal = parseFloat((bVal + cgstVal + sgstVal).toFixed(2));
        
        next.cgst = cgstVal.toString();
        next.sgst = sgstVal.toString();
        next.total = totalVal.toString();
      }
      return next;
    });
  };

  const handleRotate = () => {
    setRotation(r => (r + 90) % 360);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!currentImg) return;
    
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/save-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: currentImg.id,
          dateFolder: currentImg.folder,
          data: {
            date: formData.date,
            invoiceNo: formData.invoiceNo,
            guestName: formData.guestName,
            roomNo: formData.roomNo,
            basic: parseFloat(formData.basic) || 0,
            cgst: parseFloat(formData.cgst) || 0,
            sgst: parseFloat(formData.sgst) || 0,
            total: parseFloat(formData.total) || 0,
            phone: formData.phone,
            paymentMode: formData.paymentMode
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        // Update local state
        setAuditedResults(prev => ({
          ...prev,
          [currentImg.id]: {
            fileName: currentImg.id,
            dateFolder: currentImg.folder,
            data: {
              date: formData.date,
              invoiceNo: formData.invoiceNo,
              guestName: formData.guestName,
              roomNo: formData.roomNo,
              basic: parseFloat(formData.basic) || 0,
              cgst: parseFloat(formData.cgst) || 0,
              sgst: parseFloat(formData.sgst) || 0,
              total: parseFloat(formData.total) || 0,
              phone: formData.phone,
              paymentMode: formData.paymentMode
            }
          }
        }));
        
        // Go to next if not at the end
        if (currentIndex < filteredList.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          alert("Reached the end of the filtered list!");
        }
      } else {
        alert("Failed to save audit: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving visual audit.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading manifest and audited records...</div>;
  }

  const auditedCount = manifest.filter(img => auditedResults[img.id]).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
      
      {/* Sidebar with Image List */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Audited: {auditedCount} / {manifest.length}</h3>
          
          <select 
            value={filterMode} 
            onChange={(e) => { setFilterMode(e.target.value); setCurrentIndex(0); }}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="all">All Images</option>
            <option value="unaudited">Unaudited Only</option>
            <option value="audited">Audited Only</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredList.map((img, idx) => {
            const isSelected = idx === currentIndex;
            const isAudited = !!auditedResults[img.id];
            
            return (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(idx)}
                id={`audit-list-item-${idx}`}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                  background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  {img.originalName}
                </span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: isAudited ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isAudited ? 'var(--success)' : 'var(--danger)' }}>
                  {isAudited ? 'Done' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Visual Audit Workspace */}
      {!currentImg ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3>No images in this filter</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Left Side: Image Viewer */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', height: '75vh', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentImg.folder} / {currentImg.originalName}</span>
              <button 
                id="btn-rotate-image"
                type="button"
                onClick={handleRotate} 
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                Rotate 90°
              </button>
            </div>
            
            <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16' }}>
              <img 
                src={currentImg.path} 
                id="visual-audit-bill-image"
                alt="Stay Bill"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  transform: `rotate(${rotation}deg)`, 
                  transition: 'transform 0.2s',
                  objectFit: 'contain'
                }} 
              />
            </div>
          </div>
          
          {/* Right Side: Audit Form */}
          <form 
            onSubmit={handleSave}
            id="visual-audit-form"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '75vh', overflowY: 'auto' }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              Bill Extraction Form
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Date (YYYY-MM-DD)</label>
                <input 
                  type="text" 
                  name="date" 
                  id="audit-input-date"
                  value={formData.date} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Invoice / Bill No</label>
                <input 
                  type="text" 
                  name="invoiceNo" 
                  id="audit-input-invoice"
                  value={formData.invoiceNo} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Guest Name</label>
              <input 
                type="text" 
                name="guestName" 
                id="audit-input-guest"
                value={formData.guestName} 
                onChange={handleInputChange} 
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Room No(s)</label>
                <input 
                  type="text" 
                  name="roomNo" 
                  id="audit-input-room"
                  value={formData.roomNo} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Phone / Contact</label>
                <input 
                  type="text" 
                  name="phone" 
                  id="audit-input-phone"
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Taxable Basic (Subtotal)</label>
                <input 
                  type="text" 
                  name="basic" 
                  id="audit-input-basic"
                  value={formData.basic} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>CGST (2.5%)</label>
                <input 
                  type="text" 
                  name="cgst" 
                  id="audit-input-cgst"
                  value={formData.cgst} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>SGST (2.5%)</label>
                <input 
                  type="text" 
                  name="sgst" 
                  id="audit-input-sgst"
                  value={formData.sgst} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Total Amount</label>
                <input 
                  type="text" 
                  name="total" 
                  id="audit-input-total"
                  value={formData.total} 
                  onChange={handleInputChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Payment Mode</label>
              <select 
                name="paymentMode" 
                id="audit-input-paymentmode"
                value={formData.paymentMode} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Treebo">Treebo (Prepaid)</option>
                <option value="Disha">Disha Co (B2B Unpaid)</option>
                <option value="Unpaid">Unpaid / Other</option>
              </select>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600' }}
              >
                Previous
              </button>
              <button 
                type="submit" 
                id="btn-save-audit"
                disabled={saving}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                {saving ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
