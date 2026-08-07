import React, { useState, useEffect } from 'react';

interface PaymentMethod {
  processor: string;
  label: string;
  fee_percentage: number;
  supported: boolean;
}

interface PaymentRecord {
  id: string;
  processor: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  created_at: string;
}

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('stripe');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/payment/methods').then(r => r.json()).then(d => setMethods(d.methods || []));
    fetch('/api/payment/history').then(r => r.json()).then(d => setHistory(d.payments || []));
  }, []);

  const handleProcess = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setResult({ success: false, message: 'Enter a valid amount' });
      return;
    }
    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processor: selectedMethod, amount: amt, currency }),
      });
      const data = await res.json();
      setResult({ success: res.ok, message: res.ok ? 'Payment processed successfully' : (data.error || 'Payment failed') });
      if (res.ok) {
        setAmount('');
        fetch('/api/payment/history').then(r => r.json()).then(d => setHistory(d.payments || []));
      }
    } catch (e: any) {
      setResult({ success: false, message: e?.message || 'Payment failed' });
    }
    setProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Payment Methods</h2>

      <div className="space-y-3 mb-6" data-testid="payment-methods">
        {methods.map(m => (
          <label
            key={m.processor}
            className={`flex items-center justify-between p-4 border cursor-pointer transition ${selectedMethod === m.processor ? 'border-2 bg-purple-50' : 'border-gray-300'}`}
            style={selectedMethod === m.processor ? { borderColor: '#C108AB' } : {}}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment-method"
                value={m.processor}
                checked={selectedMethod === m.processor}
                onChange={() => setSelectedMethod(m.processor)}
                disabled={!m.supported}
              />
              <div>
                <div className="font-medium">{m.label}</div>
                <div className="text-sm text-gray-500">Fee: {m.fee_percentage}% · {m.supported ? 'Available' : 'Coming soon'}</div>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="p-4 bg-white border border-gray-300 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-sm text-gray-600 block mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 px-3 py-2"
              data-testid="payment-amount"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleProcess}
          disabled={processing}
          className="w-full mt-4 py-3 text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: '#C108AB' }}
          data-testid="process-payment"
        >
          {processing ? 'Processing...' : 'Process Payment'}
        </button>
        {result && (
          <div
            className={`mt-3 p-3 text-sm ${result.success ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'}`}
            style={{ borderWidth: '1px' }}
          >
            {result.message}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Recent Payments</h3>
          <div className="space-y-2" data-testid="payment-history">
            {history.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 text-sm">
                <div>
                  <span className="font-medium">{p.processor.toUpperCase()}</span>
                  <span className="ml-2 text-gray-500">{p.id}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency }).format(p.amount)}</div>
                  <div className="text-xs text-gray-500">{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}