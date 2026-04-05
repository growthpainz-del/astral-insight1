import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, ShieldCheck, Lock, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="text-purple-300 hover:text-white mb-4 hover:bg-purple-900/30">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Privacy Policy & Disclaimers</h1>
          <p className="text-white/60">Last updated: April 2026</p>
        </div>
        
        <section className="bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-300">Entertainment Purposes Only</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Astral Insight and all related oracle, tarot, pendulum, and divination features are provided strictly for <strong>entertainment purposes only</strong>. 
            The readings, interpretations, and AI-generated guidance do not constitute professional, financial, medical, psychological, or legal advice. 
            Users should not make life decisions based solely on the guidance provided by this application.
          </p>
        </section>

        <section className="bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-cyan-300">Secured Storage of Client Logins</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Your security is our priority. All client logins, authentication processes, and active sessions use <strong>secured storage</strong> and industry-standard encryption. 
            We do not store your passwords in plain text, and we ensure that your account access is strictly protected.
          </p>
        </section>

        <section className="bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-emerald-300">Data Privacy</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            We respect your data privacy. The personal information, private journals, and readings you generate are kept private to your account unless you explicitly choose to share them publicly. 
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-red-500/30 shadow-lg space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-red-300">Data Can Be Deleted</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            You have full control over your data. <strong>Your data can be deleted</strong> at any time. 
            You can permanently delete your account, your saved readings, custom decks, and all associated personal information by visiting the <strong>Account</strong> page and selecting the "Delete Account" option. 
            This action immediately purges your data from our active databases and cannot be undone.
          </p>
        </section>
        
        <div className="pt-8 text-center">
          <Link to={createPageUrl('Account')}>
            <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-900/30">
              Manage Account & Data
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}