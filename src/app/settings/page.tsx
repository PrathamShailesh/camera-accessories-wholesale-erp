'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Cloud,
  FileText,
  Save,
  Mail,
} from 'lucide-react';
import ImageUploadField from '@/components/ui/ImageUploadField';

interface CompanySettings {
  id: string;
  companyName: string;
  tradingName: string;
  logoUrl: string;
  taxRegistrationNumber: string;
  vatGstNumber: string;
  companyAddress: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  currencySymbol: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftBic: string;
  iban: string;
  routingCode: string;
  invoicePrefix: string;
  proformaPrefix: string;
  invoiceNextNumber: number;
  proformaNextNumber: number;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  // Email Configuration
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  updatedAt: Date;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Settings not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ERP Company & System Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure legal entity details, JPMorgan Chase banking instructions, invoice numbering & Cloudinary credentials.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
            <CheckCircle2 className="h-4 w-4" />
            <span>Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Cloudinary Integration Status Card */}
        <div className="p-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 shadow-glow flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Cloudinary Cloud Storage Integration</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active & Connected
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Connected to cloud: <code className="text-cyan-400">camera-erp-dev2</code> with API Key <code>458222176179132</code>. Cloudinary CDN handles all product images, package inspection photos, and Airway Bill PDF archives.
          </p>
        </div>

        {/* Company Profile */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            <Building2 className="h-4 w-4 text-brand-400" />
            <span>Company Legal Entity Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Trading Name</label>
              <input
                type="text"
                value={settings.tradingName}
                onChange={(e) => setSettings({ ...settings, tradingName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Registered Address</label>
              <input
                type="text"
                value={settings.companyAddress}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Tax Registration #</label>
              <input
                type="text"
                value={settings.taxRegistrationNumber}
                onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <ImageUploadField
                value={settings.logoUrl}
                onChange={(url) => setSettings({ ...settings, logoUrl: url })}
                label="Official App & Document Header Logo"
                placeholder="Paste logo URL or upload PNG/SVG image"
              />
            </div>
          </div>
        </div>

        {/* Banking Instructions (PDF Generation) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>Bank & Wire Transfer Instructions (Rendered on Invoices)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1 font-sans">Bank Name</label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-sans">Account Beneficiary</label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-sans">Account Number</label>
              <input
                type="text"
                value={settings.accountNumber}
                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-sans">SWIFT / BIC Code</label>
              <input
                type="text"
                value={settings.swiftBic}
                onChange={(e) => setSettings({ ...settings, swiftBic: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-sans">IBAN</label>
              <input
                type="text"
                value={settings.iban}
                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-sans">Routing Code</label>
              <input
                type="text"
                value={settings.routingCode}
                onChange={(e) => setSettings({ ...settings, routingCode: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            <Mail className="h-4 w-4 text-brand-400" />
            <span>Email Configuration (SMTP)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">SMTP Host</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SMTP Port</label>
              <input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SMTP User (Email)</label>
              <input
                type="text"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SMTP Password (App Password)</label>
              <input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                placeholder="Enter your app password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">From Name</label>
              <input
                type="text"
                value={settings.smtpFromName}
                onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">From Email</label>
              <input
                type="text"
                value={settings.smtpFromEmail}
                onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice Numbering Prefix */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            <FileText className="h-4 w-4 text-brand-400" />
            <span>Automatic Numbering Sequences</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1 font-sans">Proforma Prefix</label>
              <input
                type="text"
                value={settings.proformaPrefix}
                onChange={(e) => setSettings({ ...settings, proformaPrefix: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-sans">Tax Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
