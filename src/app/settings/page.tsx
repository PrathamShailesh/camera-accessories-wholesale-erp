'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, FileText, Mail, Save } from 'lucide-react';
import ImageUploadField from '@/components/ui/ImageUploadField';
import { fetchSettingsCached, invalidateSettings } from '@/lib/client-cache';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

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
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  updatedAt: Date;
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-6">
      <div className="flex items-start gap-2.5 mb-4">
        <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
          {description && <p className="text-sm text-muted mt-1">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadSettings = async () => {
    setLoadError(false);
    try {
      const data = await fetchSettingsCached(true);
      if (data) setSettings(data);
      else setLoadError(true);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      invalidateSettings();
      toast({ title: 'Settings saved', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Could not save settings', description: err.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const set = (patch: Partial<CompanySettings>) => setSettings((s) => (s ? { ...s, ...patch } : s));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <ErrorState
        title="Unable to load settings"
        description="We couldn't reach the settings service. Check your connection and try again."
        action={<Button onClick={loadSettings}>Try Again</Button>}
      />
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8 pb-16 max-w-3xl">
      <PageHeader
        eyebrow="07 / ADMINISTRATION"
        title="Settings"
        description="Company identity, banking details, document numbering, and email delivery."
        actions={
          <Button type="submit" loading={isSaving} iconLeft={!isSaving ? <Save className="h-4 w-4" /> : undefined}>
            Save Changes
          </Button>
        }
      />

      <Section icon={Building2} title="Company" description="Legal entity details shown on invoices and proformas.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Legal Name"
            value={settings.companyName}
            onChange={(e) => set({ companyName: e.target.value })}
          />
          <Input
            label="Trading Name"
            value={settings.tradingName}
            onChange={(e) => set({ tradingName: e.target.value })}
          />
          <Input
            label="Registered Address"
            wrapperClassName="sm:col-span-2"
            value={settings.companyAddress}
            onChange={(e) => set({ companyAddress: e.target.value })}
          />
          <Input
            label="Tax Registration Number"
            value={settings.taxRegistrationNumber}
            onChange={(e) => set({ taxRegistrationNumber: e.target.value })}
          />
          <Input
            label="VAT / GST Number"
            value={settings.vatGstNumber}
            onChange={(e) => set({ vatGstNumber: e.target.value })}
          />
          <Input label="Phone" value={settings.phone} onChange={(e) => set({ phone: e.target.value })} />
          <Input label="Email" type="email" value={settings.email} onChange={(e) => set({ email: e.target.value })} />
          <Input
            label="Website"
            wrapperClassName="sm:col-span-2"
            value={settings.website}
            onChange={(e) => set({ website: e.target.value })}
          />
          <div className="sm:col-span-2">
            <ImageUploadField
              value={settings.logoUrl}
              onChange={(url) => set({ logoUrl: url })}
              label="Company Logo"
              placeholder="Paste a logo URL, or upload a PNG/SVG"
            />
          </div>
        </div>
      </Section>

      <Section
        icon={CreditCard}
        title="Banking"
        description="Wire transfer instructions rendered on invoices and proformas."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Bank Name" wrapperClassName="sm:col-span-2" value={settings.bankName} onChange={(e) => set({ bankName: e.target.value })} />
          <Input label="Account Name" value={settings.accountName} onChange={(e) => set({ accountName: e.target.value })} />
          <Input label="Account Number" value={settings.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} />
          <Input label="SWIFT / BIC" value={settings.swiftBic} onChange={(e) => set({ swiftBic: e.target.value })} />
          <Input label="IBAN" value={settings.iban} onChange={(e) => set({ iban: e.target.value })} />
          <Input label="Routing Code" value={settings.routingCode} onChange={(e) => set({ routingCode: e.target.value })} />
        </div>
      </Section>

      <Section icon={FileText} title="Document Numbering" description="Prefixes and next sequence numbers for generated documents.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Invoice Prefix" value={settings.invoicePrefix} onChange={(e) => set({ invoicePrefix: e.target.value })} />
          <Input
            label="Next Invoice Number"
            type="number"
            min={1}
            value={settings.invoiceNextNumber}
            onChange={(e) => set({ invoiceNextNumber: Number(e.target.value) })}
          />
          <Input label="Proforma Prefix" value={settings.proformaPrefix} onChange={(e) => set({ proformaPrefix: e.target.value })} />
          <Input
            label="Next Proforma Number"
            type="number"
            min={1}
            value={settings.proformaNextNumber}
            onChange={(e) => set({ proformaNextNumber: Number(e.target.value) })}
          />
          <Input
            label="Default Payment Terms"
            wrapperClassName="sm:col-span-2"
            value={settings.defaultPaymentTerms}
            onChange={(e) => set({ defaultPaymentTerms: e.target.value })}
          />
          <Input
            label="Default Delivery Terms"
            wrapperClassName="sm:col-span-2"
            value={settings.defaultDeliveryTerms}
            onChange={(e) => set({ defaultDeliveryTerms: e.target.value })}
          />
        </div>
      </Section>

      <Section icon={Mail} title="Email Delivery" description="SMTP credentials used to send proformas and invoices to customers.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="SMTP Host" value={settings.smtpHost} onChange={(e) => set({ smtpHost: e.target.value })} />
          <Input
            label="SMTP Port"
            type="number"
            value={settings.smtpPort}
            onChange={(e) => set({ smtpPort: Number(e.target.value) })}
          />
          <Input label="SMTP Username" value={settings.smtpUser} onChange={(e) => set({ smtpUser: e.target.value })} />
          <Input
            label="SMTP Password"
            type="password"
            value={settings.smtpPassword}
            onChange={(e) => set({ smtpPassword: e.target.value })}
            hint="Stored securely and never shown in documents."
          />
          <Input label="From Name" value={settings.smtpFromName} onChange={(e) => set({ smtpFromName: e.target.value })} />
          <Input
            label="From Email"
            type="email"
            value={settings.smtpFromEmail}
            onChange={(e) => set({ smtpFromEmail: e.target.value })}
          />
        </div>
      </Section>

      <div className="flex justify-end border-t border-line pt-5">
        <Button type="submit" loading={isSaving} iconLeft={!isSaving ? <Save className="h-4 w-4" /> : undefined}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
