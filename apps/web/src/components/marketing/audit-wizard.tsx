'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { auditSchema, type AuditInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
const steps: (keyof AuditInput)[][] = [
  ['website', 'competitor'],
  ['channel', 'businessType'],
  ['name', 'email', 'linkedin', 'consent'],
];
export function AuditWizard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const {
    register,
    trigger,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AuditInput>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      website: '',
      competitor: '',
      channel: 'Meta Ads',
      businessType: 'E-commerce',
      name: '',
      email: '',
      linkedin: '',
      consent: false,
      company: '',
      requestId: '',
    },
  });
  const field = (
    name: 'website' | 'competitor' | 'name' | 'email' | 'linkedin',
    label: string,
    placeholder: string,
    type = 'text',
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        autoComplete={name === 'email' ? 'email' : name === 'name' ? 'name' : 'url'}
      />
      {errors[name] && (
        <small className="form-error" id={`${name}-error`}>
          {errors[name]?.message}
        </small>
      )}
    </label>
  );
  const advance = async () => {
    if (await trigger(steps[step], { shouldFocus: true })) {
      setStep(step + 1);
      requestAnimationFrame(() => heading.current?.focus());
    }
  };
  async function submit(values: AuditInput) {
    setError('');
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Your request could not be sent. Please try again.');
        return;
      }
      setReceipt(result.id);
    } catch {
      setError('Connection interrupted. Your entries are still here. Please try again.');
    }
  }
  if (receipt)
    return (
      <div className="form-card" role="status">
        <div className="receipt-icon">
          <Check />
        </div>
        <h2>Your growth audit is in.</h2>
        <p>
          We’ve saved your request. The team will review your funnel, creative, and acquisition
          approach using the details you shared.
        </p>
        <p>Reference: {receipt.slice(0, 8).toUpperCase()}</p>
        <Button asChild>
          <Link href="/booking">
            Choose a discovery time <ArrowRight size={17} />
          </Link>
        </Button>
      </div>
    );
  return (
    <form
      className="form-card"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 2) {
          void advance();
          return;
        }
        setValue(
          'requestId',
          document.getElementById('audit-request-id')?.getAttribute('data-id') ||
            crypto.randomUUID(),
        );
        void handleSubmit(submit)(e);
      }}
    >
      <input
        id="audit-request-id"
        type="hidden"
        ref={(el) => {
          if (el && !el.dataset.id) el.dataset.id = crypto.randomUUID();
        }}
      />
      <div className="wizard-progress" aria-label={`Step ${step + 1} of 3`}>
        {['Your business', 'Your acquisition', 'Your details'].map((label, i) => (
          <span
            key={label}
            className={i <= step ? 'active' : ''}
            aria-current={i === step ? 'step' : undefined}
          >
            0{i + 1} · {label}
          </span>
        ))}
      </div>
      <div className="wizard-step">
        <h3 ref={heading} tabIndex={-1}>
          {
            [
              'Let’s see the bigger picture.',
              'Where are you growing?',
              'Where should we send our findings?',
            ][step]
          }
        </h3>
        {step === 0 && (
          <>
            {field('website', 'Your website', 'https://yourbrand.com', 'url')}
            {field('competitor', 'Your primary competitor', 'https://competitor.com', 'url')}
          </>
        )}
        {step === 1 && (
          <>
            <label className="field">
              <span>Main advertising channel</span>
              <select {...register('channel')}>
                {['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Other'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Business type</span>
              <select {...register('businessType')}>
                {['E-commerce', 'B2B SaaS', 'Other'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <div className="form-grid">
              {field('name', 'Your name', 'Alex Morgan')}
              {field('email', 'Work email', 'alex@yourbrand.com', 'email')}
            </div>
            {field('linkedin', 'LinkedIn profile', 'https://www.linkedin.com/in/yourname', 'url')}
            <div>
              <label className="checkbox-field">
                <input type="checkbox" {...register('consent')} />
                <span>
                  I agree to the <Link href="/privacy">privacy notice</Link> and to being contacted
                  about this audit.
                </span>
              </label>
              {errors.consent && <p className="form-error">{errors.consent.message}</p>}
            </div>
          </>
        )}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this empty
          <input {...register('company')} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="wizard-actions">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={isSubmitting}
          >
            <ArrowLeft size={15} /> Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : step === 2 ? 'Request my audit' : 'Continue'}
          <ArrowRight size={16} />
        </Button>
      </div>
      <p className="input-explanation">
        No ad-account credentials required. Your information stays private.
      </p>
    </form>
  );
}
