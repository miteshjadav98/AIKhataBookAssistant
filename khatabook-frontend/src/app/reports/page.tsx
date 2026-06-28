"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { exportToCsv, exportToExcel } from "@/lib/exportUtils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ReportsPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Default to current month
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState<'invoices' | 'customers' | 'dues'>('invoices');

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reports?startDate=${startDate}&endDate=${endDate}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/auth/login");
          return;
        }
        throw new Error("Failed to fetch report data");
      }
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, router]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatInvoicesForExport = (invoices: any[]) => {
    return invoices.map((inv, index) => ({
      "Sr Number": index + 1,
      "Invoice Number": inv.invoiceNumber || 'N/A',
      "Customer Name": inv.customer?.name || 'Walk-in',
      "Items": inv.items && Array.isArray(inv.items) ? inv.items.map((item: any) => `${item.productName || item.productId?.slice(-6) || 'Item'} (x${item.qty})`).join(', ') : '',
      "Subtotal": inv.subtotal,
      "Discount": inv.discount,
      "Paid Amount": inv.paidAmount,
      "Due Amount": inv.dueAmount,
      "Date": new Date(inv.createdAt).toLocaleDateString()
    }));
  };

  const formatCustomersForExport = (customers: any[]) => {
    return customers.map((c, index) => ({
      "Sr Number": index + 1,
      "Customer Name": c.customerName,
      "Phone": c.customerPhone,
      "Total Purchases": c.totalPurchases,
      "Total Paid": c.totalPaid,
      "Total Due": c.totalDue,
      "Invoices Count": c.invoiceCount
    }));
  };

  const formatDuesForExport = (dues: any[]) => {
    return dues.map((c, index) => ({
      "Sr Number": index + 1,
      "Customer Name": c.name,
      "Phone": c.phone || 'N/A',
      "Total Outstanding Balance": c.totalReceivable
    }));
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    if (activeTab === 'invoices') exportToCsv(formatInvoicesForExport(reportData.invoices), `Invoices_${startDate}_to_${endDate}`);
    if (activeTab === 'customers') exportToCsv(formatCustomersForExport(reportData.customerSummary), `Customer_Summary_${startDate}_to_${endDate}`);
    if (activeTab === 'dues') exportToCsv(formatDuesForExport(reportData.outstandingDues), `Outstanding_Dues`);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    if (activeTab === 'invoices') exportToExcel(formatInvoicesForExport(reportData.invoices), `Invoices_${startDate}_to_${endDate}`, 'Invoices');
    if (activeTab === 'customers') exportToExcel(formatCustomersForExport(reportData.customerSummary), `Customer_Summary_${startDate}_to_${endDate}`, 'Customers');
    if (activeTab === 'dues') exportToExcel(formatDuesForExport(reportData.outstandingDues), `Outstanding_Dues`, 'Dues');
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">View and export business reports</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Start Date</label>
          <input 
            type="date" 
            className={styles.dateInput} 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
        </div>
        <div className={styles.filterGroup}>
          <label>End Date</label>
          <input 
            type="date" 
            className={styles.dateInput} 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
        </div>
        
        <div className={styles.actions}>
          <button className="btn-secondary" onClick={handleExportCsv} disabled={!reportData}>
            <i className="fas fa-file-csv"></i> Export CSV
          </button>
          <button className="btn-secondary" onClick={handleExportExcel} disabled={!reportData}>
            <i className="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading reports...</div>
      ) : reportData ? (
        <>
          <div className="metrics-grid">
            <div className="metric-card revenue">
              <div className="metric-label">Total Sales</div>
              <div className="metric-value">₹{Number(reportData.salesSummary.totalSales || 0).toFixed(2)}</div>
            </div>
            <div className="metric-card collected">
              <div className="metric-label">Total Collected</div>
              <div className="metric-value">₹{Number(reportData.salesSummary.totalPaid || 0).toFixed(2)}</div>
            </div>
            <div className="metric-card due">
              <div className="metric-label">Outstanding from Sales</div>
              <div className="metric-value">₹{Number(reportData.salesSummary.totalDue || 0).toFixed(2)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Invoices Count</div>
              <div className="metric-value">{reportData.salesSummary.invoiceCount}</div>
            </div>
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'invoices' ? styles.active : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              Invoices
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'customers' ? styles.active : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              Customer Summary
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'dues' ? styles.active : ''}`}
              onClick={() => setActiveTab('dues')}
            >
              Overall Dues
            </button>
          </div>

          <div className={styles.tableContainer}>
            {activeTab === 'invoices' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Subtotal</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customer?.name || 'Walk-in'}</td>
                      <td>₹{Number(inv.subtotal || 0).toFixed(2)}</td>
                      <td style={{ color: '#22c55e' }}>₹{Number(inv.paidAmount || 0).toFixed(2)}</td>
                      <td style={{ color: '#ef4444' }}>₹{Number(inv.dueAmount || 0).toFixed(2)}</td>
                      <td>
                        {inv.pdfUrl && (
                          <a href={`${API_URL.replace('/api', '')}${inv.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                            <i className="fas fa-file-pdf"></i> PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reportData.invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No invoices found in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'customers' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Total Purchases</th>
                    <th>Total Paid</th>
                    <th>Total Due</th>
                    <th>Invoices Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.customerSummary.map((c: any) => (
                    <tr key={c.customerId}>
                      <td>{c.customerName}</td>
                      <td>{c.customerPhone}</td>
                      <td>₹{Number(c.totalPurchases || 0).toFixed(2)}</td>
                      <td style={{ color: '#22c55e' }}>₹{Number(c.totalPaid || 0).toFixed(2)}</td>
                      <td style={{ color: '#ef4444' }}>₹{Number(c.totalDue || 0).toFixed(2)}</td>
                      <td>{c.invoiceCount}</td>
                    </tr>
                  ))}
                  {reportData.customerSummary.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No customer activity in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'dues' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Total Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.outstandingDues.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.phone || 'N/A'}</td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{Number(c.totalReceivable || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {reportData.outstandingDues.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No outstanding dues across all customers! 🎉</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
