import React, { useState, useEffect } from 'react';
import { 
  FiFileText, 
  FiBarChart2, 
  FiDownload, 
  FiRefreshCw,
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiTrendingUp,
  FiUserCheck
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './ReportsDashboard.css';

const ReportsDashboard = () => {
  const [reportType, setReportType] = useState('INTERNSHIPS');
  const [dateRange, setDateRange] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    setStartDate(monthAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const getDateRangeValues = () => {
    const today = new Date();
    let start = new Date();
    
    switch(dateRange) {
      case 'TODAY':
        start = today;
        break;
      case 'WEEK':
        start.setDate(today.getDate() - 7);
        break;
      case 'MONTH':
        start.setDate(today.getDate() - 30);
        break;
      case 'YEAR':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'CUSTOM':
        return { startDate, endDate };
      default:
        start.setDate(today.getDate() - 30);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let payload = { reportType, dateRange, format: 'JSON' };
      
      if (dateRange === 'CUSTOM') {
        if (!startDate || !endDate) {
          toast.error('Please select both start and end dates');
          setLoading(false);
          return;
        }
        payload.startDate = startDate;
        payload.endDate = endDate;
      } else {
        const dates = getDateRangeValues();
        payload.startDate = dates.startDate;
        payload.endDate = dates.endDate;
      }
      
      const response = await api.post('/admin/reports/generate', payload);
      setReportData(response.data);
      toast.success('Report generated');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!reportData) {
      toast.error('Please generate report first');
      return;
    }
    
    setDownloading(true);
    try {
      let payload = { reportType, dateRange, format: 'CSV' };
      
      if (dateRange === 'CUSTOM') {
        payload.startDate = startDate;
        payload.endDate = endDate;
      } else {
        const dates = getDateRangeValues();
        payload.startDate = dates.startDate;
        payload.endDate = dates.endDate;
      }
      
      const response = await api.post('/admin/reports/download', payload, {
        responseType: 'blob'
      });
      
      const filename = `${reportType.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.csv`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const getReportOptions = () => [
    { value: 'INTERNSHIPS', label: 'Internships', icon: <FiBriefcase /> },
    { value: 'APPLICATIONS', label: 'Applications', icon: <FiFileText /> },
    { value: 'USERS', label: 'Users', icon: <FiUsers /> },
    { value: 'COMPANIES', label: 'Companies', icon: <FiBriefcase /> },
    { value: 'STUDENTS', label: 'Students', icon: <FiUserCheck /> }
  ];

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    
    const summary = reportData.summary;
    return (
      <div className="summary-grid">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="summary-item">
            <div className="summary-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="summary-label">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (!reportData?.details || reportData.details.length === 0) return null;
    
    const headers = Object.keys(reportData.details[0]);
    
    return (
      <div className="report-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header.replace(/([A-Z])/g, ' $1').trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.details.map((row, idx) => (
                <tr key={idx}>
                  {headers.map(header => (
                    <td key={header}>{row[header] !== null && row[header] !== undefined ? row[header] : '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate and download reports</p>
      </div>

      {/* Controls */}
      <div className="controls-card">
        <div className="controls-row">
          <div className="control">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {getReportOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
              <option value="YEAR">Last 12 Months</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {dateRange === 'CUSTOM' && (
            <div className="control date-range">
              <label>From - To</label>
              <div className="date-inputs">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span>to</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className="control actions">
            <label>&nbsp;</label>
            <div className="btn-group">
              <button onClick={generateReport} disabled={loading} className="btn btn-primary">
                <FiRefreshCw className={loading ? 'spin' : ''} />
                {loading ? 'Generating...' : 'Generate'}
              </button>
              <button onClick={downloadCSV} disabled={downloading || !reportData} className="btn btn-secondary">
                <FiDownload />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating report...</p>
        </div>
      )}

      {/* Results */}
      {reportData && !loading && (
        <div className="results-card">
          <div className="results-header">
            <h2>{getReportOptions().find(opt => opt.value === reportType)?.label} Report</h2>
            <span className="date-badge">
              <FiCalendar />
              {reportData.dateRange || 'Custom Range'}
            </span>
          </div>

          {renderSummaryCards()}
          {renderTable()}
        </div>
      )}

      {/* Empty */}
      {!reportData && !loading && (
        <div className="empty-card">
          <div className="empty-icon">📊</div>
          <h3>No report yet</h3>
          <p>Select report type and date range, then click Generate</p>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;