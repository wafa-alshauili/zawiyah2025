// واجهة الحجوزات التاريخية - صفحة لعرض وإدارة الحجوزات السابقة
// Historical Bookings Interface - Page for viewing and managing past bookings

import React, { useState, useEffect } from 'react';
import historicalData from '../services/historicalData';

const HistoricalBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    teacher: '',
    subject: '',
    classroom: '',
    dateFrom: '',
    dateTo: '',
    phone: ''
  });
  const [quickStats, setQuickStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);

  // تحميل الإحصائيات السريعة عند بدء التشغيل
  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      const stats = await historicalData.getQuickStats();
      setQuickStats(stats);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  // تحميل الحجوزات حسب الفترة المحددة
  const loadBookingsByPeriod = async (period) => {
    setLoading(true);
    try {
      let result = [];
      
      switch (period) {
        case 'lastWeek':
          const lastWeekBookings = await historicalData.getLastWeekBookings();
          result = Object.entries(lastWeekBookings).map(([ref, booking]) => ({
            ...booking,
            referenceNumber: ref
          }));
          break;
          
        case 'lastMonth':
          const lastMonthBookings = await historicalData.getLastMonthBookings();
          result = Object.entries(lastMonthBookings).map(([ref, booking]) => ({
            ...booking,
            referenceNumber: ref
          }));
          break;
          
        case 'lastYear':
          const lastYearBookings = await historicalData.getLastYearBookings();
          result = Object.entries(lastYearBookings).map(([ref, booking]) => ({
            ...booking,
            referenceNumber: ref
          }));
          break;
          
        default:
          const allBookings = await historicalData.getAllBookingsFromStorage();
          result = Object.entries(allBookings).map(([ref, booking]) => ({
            ...booking,
            referenceNumber: ref
          }));
      }
      
      // ترتيب حسب التاريخ (الأحدث أولاً)
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBookings(result);
      
    } catch (error) {
      console.error('خطأ في تحميل الحجوزات:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // البحث في الحجوزات
  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await historicalData.searchHistoricalBookings(searchCriteria);
      setBookings(results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // تحميل الإحصائيات الشاملة
  const loadFullStatistics = async () => {
    setLoading(true);
    try {
      const stats = await historicalData.getHistoricalStatistics();
      setStatistics(stats);
      setShowStatistics(true);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  };

  // تصدير البيانات
  const exportData = async (format) => {
    try {
      const exportedData = await historicalData.exportHistoricalData(format);
      
      // إنشاء رابط التحميل
      const blob = new Blob([exportedData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zawiyah_bookings_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`تم تصدير البيانات بصيغة ${format.toUpperCase()} بنجاح!`);
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      alert('حدث خطأ في تصدير البيانات');
    }
  };

  return (
    <div className="historical-bookings-page" dir="rtl">
      {/* العنوان والإحصائيات السريعة */}
      <div className="page-header">
        <h1>📚 الحجوزات التاريخية</h1>
        {quickStats && (
          <div className="quick-stats">
            <div className="stat-card">
              <h3>إجمالي الحجوزات</h3>
              <p className="stat-number">{quickStats.total.toLocaleString()}</p>
            </div>
            {quickStats.total > 0 && (
              <>
                <div className="stat-card">
                  <h3>أقدم حجز</h3>
                  <p>{quickStats.oldestDate}</p>
                </div>
                <div className="stat-card">
                  <h3>أحدث حجز</h3>
                  <p>{quickStats.newestDate}</p>
                </div>
                <div className="stat-card">
                  <h3>معدل يومي</h3>
                  <p>{quickStats.averagePerDay} حجز/يوم</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      <div className="control-panel">
        <div className="period-selector">
          <h3>اختر الفترة:</h3>
          <div className="period-buttons">
            <button 
              className={selectedPeriod === 'all' ? 'active' : ''}
              onClick={() => {
                setSelectedPeriod('all');
                loadBookingsByPeriod('all');
              }}
            >
              جميع الأوقات
            </button>
            <button 
              className={selectedPeriod === 'lastWeek' ? 'active' : ''}
              onClick={() => {
                setSelectedPeriod('lastWeek');
                loadBookingsByPeriod('lastWeek');
              }}
            >
              الأسبوع الماضي
            </button>
            <button 
              className={selectedPeriod === 'lastMonth' ? 'active' : ''}
              onClick={() => {
                setSelectedPeriod('lastMonth');
                loadBookingsByPeriod('lastMonth');
              }}
            >
              الشهر الماضي
            </button>
            <button 
              className={selectedPeriod === 'lastYear' ? 'active' : ''}
              onClick={() => {
                setSelectedPeriod('lastYear');
                loadBookingsByPeriod('lastYear');
              }}
            >
              العام الماضي
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={loadFullStatistics}
            className="statistics-btn"
            disabled={loading}
          >
            📊 إحصائيات شاملة
          </button>
          <button 
            onClick={() => exportData('json')}
            className="export-btn"
            disabled={loading}
          >
            📤 تصدير JSON
          </button>
          <button 
            onClick={() => exportData('csv')}
            className="export-btn"
            disabled={loading}
          >
            📊 تصدير CSV
          </button>
        </div>
      </div>

      {/* نموذج البحث */}
      <div className="search-panel">
        <h3>🔍 البحث في الحجوزات:</h3>
        <div className="search-form">
          <div className="search-row">
            <input
              type="text"
              placeholder="المعلم"
              value={searchCriteria.teacher}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                teacher: e.target.value
              })}
            />
            <input
              type="text"
              placeholder="المادة"
              value={searchCriteria.subject}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                subject: e.target.value
              })}
            />
            <input
              type="text"
              placeholder="القاعة"
              value={searchCriteria.classroom}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                classroom: e.target.value
              })}
            />
          </div>
          <div className="search-row">
            <input
              type="date"
              placeholder="من تاريخ"
              value={searchCriteria.dateFrom}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                dateFrom: e.target.value
              })}
            />
            <input
              type="date"
              placeholder="إلى تاريخ"
              value={searchCriteria.dateTo}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                dateTo: e.target.value
              })}
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={searchCriteria.phone}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                phone: e.target.value
              })}
            />
            <button 
              onClick={handleSearch}
              className="search-btn"
              disabled={loading}
            >
              🔍 بحث
            </button>
            <button 
              onClick={() => {
                setSearchCriteria({
                  teacher: '', subject: '', classroom: '', 
                  dateFrom: '', dateTo: '', phone: ''
                });
                loadBookingsByPeriod(selectedPeriod);
              }}
              className="clear-btn"
            >
              🗑️ مسح
            </button>
          </div>
        </div>
      </div>

      {/* نتائج البحث */}
      {loading ? (
        <div className="loading">⏳ جاي التحميل...</div>
      ) : (
        <>
          {bookings.length > 0 ? (
            <div className="bookings-table">
              <div className="results-header">
                <h3>📋 النتائج: {bookings.length} حجز</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>الرقم المرجعي</th>
                    <th>التاريخ</th>
                    <th>المعلم</th>
                    <th>المادة</th>
                    <th>القاعة</th>
                    <th>الحصة</th>
                    <th>رقم الهاتف</th>
                    <th>الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <tr key={booking.referenceNumber || index}>
                      <td className="reference">{booking.referenceNumber}</td>
                      <td className="date">
                        {new Date(booking.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="teacher">{booking.teacher}</td>
                      <td className="subject">{booking.subject}</td>
                      <td className="classroom">{booking.classroomName}</td>
                      <td className="timeslot">{booking.timeSlot}</td>
                      <td className="phone">{booking.teacherPhone}</td>
                      <td className="notes">{booking.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">
              <p>📝 لا توجد حجوزات تطابق معايير البحث</p>
            </div>
          )}
        </>
      )}

      {/* الإحصائيات الشاملة */}
      {showStatistics && statistics && (
        <div className="statistics-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📊 الإحصائيات الشاملة</h2>
              <button 
                onClick={() => setShowStatistics(false)}
                className="close-btn"
              >
                ❌
              </button>
            </div>
            
            <div className="statistics-content">
              {/* الملخص العام */}
              <div className="stats-section">
                <h3>📈 الملخص العام</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <strong>إجمالي الحجوزات:</strong> {statistics.summary.totalBookings}
                  </div>
                  <div className="stat-item">
                    <strong>عدد المعلمين:</strong> {statistics.summary.uniqueTeachers}
                  </div>
                  <div className="stat-item">
                    <strong>عدد القاعات:</strong> {statistics.summary.uniqueClassrooms}
                  </div>
                  <div className="stat-item">
                    <strong>فترة البيانات:</strong> {statistics.summary.dataSpan} يوم
                  </div>
                </div>
              </div>

              {/* إحصائيات الفترات */}
              <div className="stats-section">
                <h3>📅 إحصائيات الفترات</h3>
                <div className="period-stats">
                  <div className="period-item">
                    <strong>هذا الأسبوع:</strong> {statistics.periodStats.thisWeek}
                  </div>
                  <div className="period-item">
                    <strong>هذا الشهر:</strong> {statistics.periodStats.thisMonth}
                  </div>
                  <div className="period-item">
                    <strong>هذا العام:</strong> {statistics.periodStats.thisYear}
                  </div>
                </div>
              </div>

              {/* أكثر المعلمين حجزاً */}
              <div className="stats-section">
                <h3>👩‍🏫 أكثر المعلمين حجزاً</h3>
                <div className="top-list">
                  {statistics.topLists.teachers.slice(0, 5).map((item, index) => (
                    <div key={index} className="top-item">
                      <span className="rank">{index + 1}</span>
                      <span className="name">{item.teacher}</span>
                      <span className="count">{item.count} حجز</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* أكثر القاعات استخداماً */}
              <div className="stats-section">
                <h3>🏫 أكثر القاعات استخداماً</h3>
                <div className="top-list">
                  {statistics.topLists.classrooms.slice(0, 5).map((item, index) => (
                    <div key={index} className="top-item">
                      <span className="rank">{index + 1}</span>
                      <span className="name">{item.classroom}</span>
                      <span className="count">{item.count} حجز</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* الاتجاهات */}
              <div className="stats-section">
                <h3>📈 الاتجاهات</h3>
                <div className="trends">
                  <div className="trend-item">
                    <strong>آخر 30 يوم:</strong> {statistics.trends.last30Days} حجز
                  </div>
                  <div className="trend-item">
                    <strong>30 يوم سابق:</strong> {statistics.trends.previous30Days} حجز
                  </div>
                  <div className="trend-item">
                    <strong>التغيير:</strong> 
                    <span className={statistics.trends.changePercent > 0 ? 'positive' : 'negative'}>
                      {statistics.trends.changePercent}% ({statistics.trends.direction})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .historical-bookings-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .page-header h1 {
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .stat-number {
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }

        .control-panel {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .period-selector h3 {
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .period-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .period-buttons button {
          padding: 10px 20px;
          border: 2px solid #3498db;
          background: white;
          color: #3498db;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .period-buttons button.active,
        .period-buttons button:hover {
          background: #3498db;
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .statistics-btn, .export-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }

        .statistics-btn {
          background: #e74c3c;
          color: white;
        }

        .export-btn {
          background: #27ae60;
          color: white;
        }

        .statistics-btn:hover {
          background: #c0392b;
        }

        .export-btn:hover {
          background: #229954;
        }

        .search-panel {
          background: #fff;
          border: 2px solid #ecf0f1;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .search-panel h3 {
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .search-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .search-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-row input {
          flex: 1;
          min-width: 150px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .search-btn, .clear-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }

        .search-btn {
          background: #3498db;
          color: white;
        }

        .clear-btn {
          background: #95a5a6;
          color: white;
        }

        .loading {
          text-align: center;
          font-size: 18px;
          padding: 40px;
          color: #7f8c8d;
        }

        .bookings-table {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .results-header {
          background: #34495e;
          color: white;
          padding: 15px 20px;
        }

        .results-header h3 {
          margin: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #ecf0f1;
        }

        th {
          background: #f8f9fa;
          font-weight: bold;
          color: #2c3e50;
        }

        tbody tr:hover {
          background: #f8f9fa;
        }

        .reference {
          font-family: monospace;
          font-weight: bold;
          color: #e74c3c;
        }

        .date {
          color: #27ae60;
          font-weight: bold;
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
          font-size: 18px;
        }

        .statistics-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 10px;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          width: 90%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #2c3e50;
          color: white;
          border-radius: 10px 10px 0 0;
        }

        .modal-header h2 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: white;
        }

        .statistics-content {
          padding: 20px;
        }

        .stats-section {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ecf0f1;
        }

        .stats-section:last-child {
          border-bottom: none;
        }

        .stats-section h3 {
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-item {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }

        .period-stats {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 15px;
        }

        .period-item {
          background: #3498db;
          color: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          flex: 1;
          min-width: 150px;
        }

        .top-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .top-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }

        .rank {
          background: #e74c3c;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .name {
          flex: 1;
          font-weight: bold;
        }

        .count {
          color: #7f8c8d;
        }

        .trends {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .trend-item {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }

        .positive {
          color: #27ae60;
          font-weight: bold;
        }

        .negative {
          color: #e74c3c;
          font-weight: bold;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .search-row {
            flex-direction: column;
          }
          
          .period-buttons {
            flex-direction: column;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          table {
            font-size: 12px;
          }
          
          th, td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default HistoricalBookingsPage;