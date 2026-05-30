import React from 'react';

interface LedgerCardProps {
  data: {
    customer_name: string;
    due_amount: number;
    recent_transactions?: any[];
  };
}

export default function LedgerCard({ data }: LedgerCardProps) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="fa-solid fa-user"></i> {data.customer_name}'s Ledger
      </h3>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: data.due_amount > 0 ? '#ef4444' : '#10b981' }}>
        {data.due_amount > 0 ? `₹${data.due_amount} Due` : `₹${Math.abs(data.due_amount)} Advance`}
      </div>
      {data.recent_transactions && data.recent_transactions.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <strong>Recent Activity:</strong>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            {data.recent_transactions.map((tx, idx) => (
              <li key={idx}>
                {new Date(tx.createdAt).toLocaleDateString()} - {tx.type === 'payment' ? 'Payment' : 'Invoice'} - ₹{tx.amount || tx.dueAmount}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
