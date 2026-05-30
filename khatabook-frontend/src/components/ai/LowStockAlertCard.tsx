import React from 'react';

interface LowStockAlertCardProps {
  data: {
    products: any[];
  };
}

export default function LowStockAlertCard({ data }: LowStockAlertCardProps) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #f59e0b' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
        <i className="fa-solid fa-triangle-exclamation"></i> Low Stock Alert
      </h3>
      
      {data.products && data.products.length > 0 ? (
        <ul style={{ paddingLeft: '0', listStyle: 'none', margin: 0 }}>
          {data.products.map((p, idx) => (
            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < data.products.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none' }}>
              <span>{p.name}</span>
              <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{p.stockQty} left</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products are currently low on stock.</p>
      )}
    </div>
  );
}
