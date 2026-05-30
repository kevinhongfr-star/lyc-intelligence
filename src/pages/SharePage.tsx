
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShareCard } from '../components/share/ShareCard';
import { getShareCard } from '../services/shareCardService';

import { DS } from '@/lib/designSystem';

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareCard, setShareCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    loadShareCard(id);
  }, [id]);

  const loadShareCard = async (publicId: string) => {
    try {
      const card = await getShareCard(publicId);
      if (card) {
        setShareCard(card);
      } else {
        setError('Share card not found');
      }
    } catch (e) {
      console.error('Failed to load share card:', e);
      setError('Failed to load share card');
    } finally {
      setIsLoading(false);
    }
  };

  // Set OG tags dynamically
  useEffect(() => {
    if (shareCard) {
      document.title = `${shareCard.data?.name || 'Executive'} — ${shareCard.data?.archetype || 'Profile'} | LYC Intelligence`;
      
      // Update OG tags
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', shareCard.image_url || '');
      }
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', document.title);
      }
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', 'Leadership profile. Powered by LYC Intelligence.');
      }
    }
  }, [shareCard]);

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: DS.bg, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ fontSize: '16px', color: DS.muted }}>Loading...</div>
      </div>
    );
  }

  if (error || !shareCard) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: DS.bg, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', color: DS.text, marginBottom: '8px' }}>
          Card not found
        </h1>
        <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '24px' }}>
          {error || 'This share card may have expired or been removed'}
        </p>
        <button 
          onClick={() => navigate('/')} 
          style={{
            padding: '10px 20px',
            background: DS.accent,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px 24px 48px' 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontFamily: DS.headingFont, 
              fontSize: '20px', 
              fontWeight: 700, 
              color: DS.accent 
            }}>
              LYC Intelligence
            </div>
          </div>
          <button 
            onClick={() => navigate('/')} 
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '8px',
              color: DS.textSecondary,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = DS.accent;
              e.currentTarget.style.color = DS.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = DS.border;
              e.currentTarget.style.color = DS.textSecondary;
            }}
          >
            Get Your Profile
          </button>
        </div>

        {/* Share Card Container */}
        <div style={{ 
          background: DS.card, 
          border: `1px solid ${DS.cardBorder}`, 
          borderRadius: '16px', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            overflowX: 'auto', 
            overflowY: 'hidden', 
            padding: '24px' 
          }}>
            <ShareCard type={shareCard.type} data={shareCard.data} />
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px' 
        }}>
          <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '12px' }}>
            Want your own career intelligence profile?
          </p>
          <button 
            onClick={() => navigate('/')} 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              background: DS.accent,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
