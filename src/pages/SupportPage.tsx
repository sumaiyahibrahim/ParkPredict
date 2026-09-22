import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LifeBuoy, PhoneCall, Mail, AlertTriangle, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { openReportModal, setCopilotOpen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does ParkPredict guarantee my reserved parking spot?',
      a: 'When you book a spot on ParkPredict, our system holds that specific bay in the facility management system. The automated FastTag barrier recognizes your license plate upon arrival. We provide a 15-minute grace window past your scheduled arrival time.'
    },
    {
      q: 'What happens if I arrive earlier or later than my reservation?',
      a: 'If you arrive up to 15 minutes early or late, your reservation remains active and your bay is held. If you arrive significantly late, our system alerts you and allows you to adjust your window or extend seamlessly through the app.'
    },
    {
      q: 'How does the AI availability prediction work?',
      a: 'Our Random Forest surrogate ML model analyzes 18 months of Chennai diurnal occupancy curves, current barrier ingress velocity, day-of-week trends, and local mall/traffic events to compute an arrival-time probability with up to 96% confidence.'
    },
    {
      q: 'Can I cancel my booking if my plans change?',
      a: 'Yes! ParkPredict offers free cancellation up to 15-30 minutes before your scheduled arrival time. An instant full refund is issued back to your original payment method with zero cancellation penalty.'
    },
    {
      q: 'How do EV charging reservations work?',
      a: 'Participating facilities with EV hubs (like VR Mall and Phoenix Marketcity) allow you to reserve a dedicated DC fast-charging bay with CCS2 / Type-2 compatibility, ensuring you never wait behind queued vehicles.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brandTeal/10 text-brandTeal mx-auto flex items-center justify-center">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
          Help & Support Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Have questions about your digital pass, FastTag tolls, or spot availability? We're here 24/7.
        </p>

        {/* Search */}
        <div className="pt-2 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles & FAQs..."
              className="w-full bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal shadow-subtle"
            />
          </div>
        </div>
      </div>

      {/* Support Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3 text-center">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Emergency Helpline</h4>
            <p className="text-xs text-slate-500 mt-0.5">Barrier or gate access issues</p>
          </div>
          <a
            href="tel:1800-425-7275"
            className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            1800-425-PARK (24/7)
          </a>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3 text-center">
          <div className="w-10 h-10 rounded-2xl bg-brandTeal/10 text-brandTeal mx-auto flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Instant AI Copilot</h4>
            <p className="text-xs text-slate-500 mt-0.5">Instant booking & parking help</p>
          </div>
          <button
            onClick={() => setCopilotOpen(true)}
            className="text-xs font-bold text-brandTeal hover:underline"
          >
            Chat with Copilot Now
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3 text-center">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Report Inaccurate Data</h4>
            <p className="text-xs text-slate-500 mt-0.5">Full lot or wrong rates</p>
          </div>
          <button
            onClick={() => openReportModal()}
            className="text-xs font-bold text-rose-500 hover:underline"
          >
            Submit Incident Report
          </button>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h3>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111C2D] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-card transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                >
                  <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
