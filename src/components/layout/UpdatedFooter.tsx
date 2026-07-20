/**
 * Updated Footer (T-602)
 * Adds webinar, diagnostic, and content links.
 */
import React from 'react';

export const UpdatedFooter: React.FC = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Diagnostics</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/assess/quest" className="hover:text-blue-600">QUEST</a></li>
            <li><a href="/assess/drive" className="hover:text-blue-600">DRIVE</a></li>
            <li><a href="/assess/impact" className="hover:text-blue-600">IMPACT</a></li>
            <li><a href="/assess/prism" className="hover:text-blue-600">PRISM</a></li>
            <li><a href="/assess/bridge" className="hover:text-blue-600">BRIDGE</a></li>
            <li><a href="/assess/mosaic" className="hover:text-blue-600">MOSAIC</a></li>
            <li><a href="/assess/forge" className="hover:text-blue-600">FORGE</a></li>
            <li><a href="/assess/spark" className="hover:text-blue-600">SPARK</a></li>
            <li><a href="/assess/shift" className="hover:text-blue-600">SHIFT</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Programmes</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/programmes/advisory" className="hover:text-blue-600">Nexus Advisory</a></li>
            <li><a href="/programmes/governance" className="hover:text-blue-600">Governance</a></li>
            <li><a href="/programmes/cross-border" className="hover:text-blue-600">Cross-Border</a></li>
            <li><a href="/programmes/ai-leadership" className="hover:text-blue-600">AI Leadership</a></li>
            <li><a href="/programmes/coaching" className="hover:text-blue-600">Executive Coaching</a></li>
          </ul>
          <h4 className="mt-6 mb-3 text-sm font-semibold text-gray-900">Workshops</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/workshops/force-1-discovery" className="hover:text-blue-600">Force 1 Discovery</a></li>
            <li><a href="/workshops/team-cohesion" className="hover:text-blue-600">Team Cohesion</a></li>
            <li><a href="/workshops/career-resilience" className="hover:text-blue-600">Career Resilience</a></li>
            <li><a href="/workshops/revenue-leadership" className="hover:text-blue-600">Revenue Leadership</a></li>
            <li><a href="/workshops/shift-facilitation" className="hover:text-blue-600">SHIFT Facilitation</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Content</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/webinars" className="hover:text-blue-600">Webinars</a></li>
            <li><a href="/insights/newsletter" className="hover:text-blue-600">Newsletter</a></li>
            <li><a href="/insights/podcast" className="hover:text-blue-600">Podcast</a></li>
            <li><a href="/insights/brief" className="hover:text-blue-600">Executive Brief</a></li>
          </ul>
          <h4 className="mt-6 mb-3 text-sm font-semibold text-gray-900">Community</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/council" className="hover:text-blue-600">The Invitation Council</a></li>
            <li><a href="/roundtable" className="hover:text-blue-600">Executive Roundtable</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Company</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/about" className="hover:text-blue-600">About LYC</a></li>
            <li><a href="/b2b" className="hover:text-blue-600">Executive Search</a></li>
            <li><a href="/advisory" className="hover:text-blue-600">Advisory</a></li>
            <li><a href="/pricing" className="hover:text-blue-600">Pricing</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        © 2026 LYC Partners. All rights reserved.
      </div>
    </div>
  </footer>
);

export default UpdatedFooter;
