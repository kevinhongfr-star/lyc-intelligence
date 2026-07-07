import React, { useState } from 'react';
import { Send } from 'lucide-react';

export function NewSearchRequest() {
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    seniority: '',
    location: '',
    requirements: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search request submitted:', formData);
    setFormData({
      position: '',
      department: '',
      seniority: '',
      location: '',
      requirements: '',
    });
  };

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Submit New Search Request</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Position Title</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:border-accent"
              placeholder="e.g., VP Risk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:border-accent"
            >
              <option value="">Select</option>
              <option value="finance">Finance</option>
              <option value="technology">Technology</option>
              <option value="operations">Operations</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Seniority</label>
            <select
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:border-accent"
            >
              <option value="">Select</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:border-accent"
              placeholder="e.g., Singapore"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Role Requirements</label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            className="w-full px-4 py-3 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:border-accent resize-none"
            rows={4}
            placeholder="Describe the key requirements, skills, and qualifications for this role..."
          />
        </div>
        
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Send className="w-4 h-4" />
          Submit Request
        </button>
      </form>
    </div>
  );
}