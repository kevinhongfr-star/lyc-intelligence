/**
 * Webinar Registration Page (T-203) — /webinars/[slug]/register
 */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWebinarBySlug } from '@/data/webinars';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';

export const WebinarRegistrationPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const webinar = slug ? getWebinarBySlug(slug) : null;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', title: '' });

  if (!webinar) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Webinar Not Found</h1>
          <Link to="/webinars" className="mt-4 text-blue-600">← Back</Link>
        </div>
      </div>
    );
  }

  const diagnosticKey = webinar.linkedDiagnostic.toLowerCase() as InstrumentColorKey;
  const color = INSTRUMENT_COLORS[diagnosticKey] ?? INSTRUMENT_COLORS.shift;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to Supabase
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">You're Registered!</h1>
          <p className="text-gray-600">We've sent a confirmation to {formData.email}. See you on {webinar.date}.</p>
          <Link to="/webinars" className="mt-6 inline-block text-blue-600 hover:underline">← Back to Webinars</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <Link to={`/webinars/${webinar.slug}`} className="mb-6 text-sm text-gray-500 hover:text-gray-700">← Back to webinar</Link>
          
          <div className="mb-6">
            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: color.main }}>
              {webinar.linkedDiagnostic}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{webinar.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{webinar.date} · {webinar.time}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" placeholder="Your name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" placeholder="your@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" placeholder="Your company" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" placeholder="Your title" />
            </div>
            <button type="submit" className="w-full rounded-lg py-3 font-semibold text-white" style={{ backgroundColor: color.main }}>
              Register for Free
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WebinarRegistrationPage;
