import React from 'react';

interface InvoicePreviewCardProps {
  data: {
    customer_name?: string;
    supplier_name?: string;
    items: any[];
    subtotal: number;
    due_amount: number;
    action_required?: boolean;
  };
}

export default function InvoicePreviewCard({ data }: InvoicePreviewCardProps) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #8b5cf6' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="fa-solid fa-file-invoice"></i> Invoice Preview
      </h3>
      <p style={{ margin: '0 0 0.5rem 0' }}>
        <strong>Entity:</strong> {data.customer_name || data.supplier_name || 'Unknown'}
      </p>
      
      <div style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <th style={{ paddingBottom: '0.5rem' }}>Item</th>
              <th style={{ paddingBottom: '0.5rem' }}>Qty</th>
              <th style={{ paddingBottom: '0.5rem' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ paddingTop: '0.5rem' }}>{item.name || item.productId}</td>
                <td style={{ paddingTop: '0.5rem' }}>{item.qty}</td>
                <td style={{ paddingTop: '0.5rem' }}>₹{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>Subtotal:</span>
        <span>₹{data.subtotal}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#ef4444' }}>
        <span>Due Amount:</span>
        <span>₹{data.due_amount}</span>
      </div>

      {data.action_required && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
          Please confirm this invoice before creating.
        </div>
      )}
    </div>
  );
}
