import React from 'react';

interface SalesSummaryCardProps {
  data: {
    total_sales: number;
    total_amount: number;
    sales: any[];
    date?: string;
  };
}

export default function SalesSummaryCard({ data }: SalesSummaryCardProps) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #10b981' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="fa-solid fa-chart-line"></i> Sales Summary {data.date ? `(${data.date})` : ''}
      </h3>
      
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Sales</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.total_sales}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>₹{data.total_amount}</div>
        </div>
      </div>

      {data.sales && data.sales.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <strong>Top Transactions:</strong>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            {data.sales.slice(0, 3).map((sale, idx) => (
              <li key={idx}>
                {sale.customerName || sale.customerId} - ₹{sale.subtotal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
