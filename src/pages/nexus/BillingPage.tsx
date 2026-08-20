import React from 'react';
import { V1 } from '@/styles/v1-tokens';

interface InvoiceRow {
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const INVOICES: InvoiceRow[] = [
  { date: 'Aug 15, 2026', description: 'Professional · Monthly', amount: '$99.00', status: 'Paid' },
  { date: 'Jul 15, 2026', description: 'Professional · Monthly', amount: '$99.00', status: 'Paid' },
  { date: 'Jun 15, 2026', description: 'Professional · Monthly', amount: '$99.00', status: 'Paid' },
  { date: 'May 15, 2026', description: 'Professional · Monthly', amount: '$99.00', status: 'Paid' },
  { date: 'Apr 15, 2026', description: 'Professional · Monthly', amount: '$99.00', status: 'Paid' },
  { date: 'Mar 15, 2026', description: 'Explorer → Professional upgrade', amount: '$149.00', status: 'Paid' },
];

export default function BillingPage() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        padding: 32,
        background: V1.cream,
        minHeight: '100vh',
        fontFamily: V1.bodyFont,
      }}
    >
      <div style={{ flex: 1, maxWidth: 760 }}>
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.teal600,
              marginBottom: 8,
            }}
          >
            Account
          </div>
          <h1
            style={{
              fontFamily: V1.displayFont,
              fontSize: 40,
              letterSpacing: V1.trackingTight,
              lineHeight: 1.1,
              color: V1.ink900,
              margin: 0,
            }}
          >
            Billing
          </h1>
          <p
            style={{
              fontFamily: V1.displayFont,
              fontStyle: 'italic',
              fontSize: 16,
              color: V1.ink600,
              margin: '10px 0 0',
            }}
          >
            Manage your subscription, payment method, and invoices.
          </p>
        </div>

        <div
          style={{
            height: 1,
            background: V1.ink100,
            margin: '32px 0',
          }}
        />

        <div
          style={{
            border: `1px solid ${V1.ink200}`,
            background: V1.white,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 24,
                    fontWeight: 600,
                    color: V1.ink900,
                  }}
                >
                  Professional
                </div>
                <span style={{ color: V1.ink400, fontSize: 14 }}>·</span>
                <div
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    color: V1.ink500,
                  }}
                >
                  Monthly subscription
                </div>
              </div>
              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 12,
                  color: V1.ink500,
                }}
              >
                Next billing · Sep 15, 2026
              </div>
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.bodyFont,
                fontSize: 14,
                color: V1.teal700,
                fontWeight: 500,
              }}
            >
              Manage plan →
            </button>
          </div>
          <p
            style={{
              fontFamily: V1.displayFont,
              fontStyle: 'italic',
              fontSize: 15,
              color: V1.ink600,
              margin: '10px 0 0',
            }}
          >
            Continuous AI coaching · 12 lenses per year · 4 coaching hours · DEX AI access.
          </p>
        </div>

        <div
          style={{
            height: 1,
            background: V1.ink100,
            margin: '40px 0',
          }}
        />

        <div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 12,
            }}
          >
            Payment method
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              border: `1px solid ${V1.ink100}`,
              background: V1.white,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 25,
                border: `1px solid ${V1.ink300}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: V1.white,
              }}
            >
              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 8,
                  letterSpacing: '0.1em',
                  color: V1.ink900,
                  fontWeight: 600,
                }}
              >
                ••••
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 15, color: V1.ink800 }}>Visa •••• 4242</div>
              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 12,
                  color: V1.ink500,
                }}
              >
                Exp 08/28
              </div>
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.bodyFont,
                fontSize: 14,
                color: V1.teal700,
                fontWeight: 500,
              }}
            >
              Update →
            </button>
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: V1.ink100,
            margin: '40px 0',
          }}
        />

        <div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 12,
            }}
          >
            Billing history
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 0.7fr 0.8fr 0.7fr',
              padding: '12px 0',
              borderBottom: `1px solid ${V1.ink200}`,
              marginBottom: 4,
            }}
          >
            {['DATE', 'DESCRIPTION', 'AMOUNT', 'STATUS', 'RECEIPT'].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 11,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: V1.ink400,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {INVOICES.map((inv, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 0.7fr 0.8fr 0.7fr',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: `1px solid ${V1.ink100}`,
              }}
            >
              <div style={{ fontSize: 14, color: V1.ink700 }}>{inv.date}</div>
              <div style={{ fontSize: 14, color: V1.ink700 }}>{inv.description}</div>
              <div style={{ fontSize: 14, color: V1.ink900, fontWeight: 500 }}>{inv.amount}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    color: inv.status === 'Paid' ? V1.ink700 : V1.ink500,
                  }}
                >
                  {inv.status}
                </span>
                <span style={{ color: V1.teal600, fontFamily: V1.monoFont, fontSize: 12 }}>·</span>
                <span style={{ color: V1.teal600, fontFamily: V1.monoFont, fontSize: 13 }}>✓</span>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: V1.bodyFont,
                  fontSize: 14,
                  color: V1.teal700,
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                Download →
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              style={{
                padding: '10px 20px',
                border: `1px solid ${V1.ink300}`,
                background: V1.white,
                color: V1.ink700,
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Load more
            </button>
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: V1.ink100,
            margin: '40px 0',
          }}
        />

        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 12,
            }}
          >
            Billing address
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.6, color: V1.ink700 }}>
              845 Market Street, Suite 400<br />
              San Francisco, CA 94103<br />
              United States
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.bodyFont,
                fontSize: 14,
                color: V1.teal700,
                fontWeight: 500,
                alignSelf: 'flex-start',
              }}
            >
              Update →
            </button>
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 12,
            }}
          >
            Tax information
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
            }}
          >
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 13,
                color: V1.ink500,
              }}
            >
              No VAT number on file
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.bodyFont,
                fontSize: 14,
                color: V1.teal700,
                fontWeight: 500,
              }}
            >
              Add →
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          width: 280,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: 'fit-content',
        }}
      >
        <div
          style={{
            border: `1px solid ${V1.ink200}`,
            background: V1.white,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 12,
            }}
          >
            Next invoice
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: V1.trackingTight,
              color: V1.ink900,
              marginBottom: 6,
            }}
          >
            $99.00
          </div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 12,
              color: V1.ink500,
              marginBottom: 20,
            }}
          >
            Due · Sep 15, 2026
          </div>

          <div
            style={{
              height: 1,
              background: V1.ink100,
              margin: '0 -20px 16px',
            }}
          />

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 6,
            }}
          >
            Plan summary
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 16,
              color: V1.ink900,
              fontWeight: 600,
            }}
          >
            Professional · $99/month
          </div>

          <div
            style={{
              height: 1,
              background: V1.ink100,
              margin: '16px -20px 16px',
            }}
          />

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 6,
            }}
          >
            Need help?
          </div>
          <button
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: V1.bodyFont,
              fontSize: 14,
              color: V1.teal700,
              fontWeight: 500,
            }}
          >
            Contact support →
          </button>
        </div>
      </div>
    </div>
  );
}
