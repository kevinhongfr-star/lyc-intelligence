import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssessmentWizard } from '../components/assessment/AssessmentWizard';
import { useAuthStore } from '../stores/authStore';

export function AssessmentPage() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuthStore();
  
  const prefillEmail = searchParams.get('email') || profile?.email || '';
  const prefillName = searchParams.get('name') || profile?.full_name || '';

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <AssessmentWizard 
        prefillEmail={prefillEmail} 
        prefillName={prefillName} 
      />
    </div>
  );
}
