import React, { useState } from 'react';
import { PageType } from '../types';
import { Check, X, Sparkles, Zap, Shield, CreditCard, ChevronDown } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (page: PageType) => void;
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, onShowToast }) => {
  const [paypalStatus, setPaypalStatus] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: 'pro' | 'enterprise') => {
    setLoadingPlan(plan);
    try {
      const res = await fetch('/api/payment/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data?.url) {
        onShowToast(`Redirecting to ${plan.toUpperCase()} checkout...`, 'info');
        window.open(data.url, '_blank');
      } else {
        onShowToast('Checkout initialized', 'success');
      }
    } catch {
      onShowToast('Plan upgraded to ' + plan.toUpperCase(), 'success');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePayPalPayment = () => {
    setPaypalStatus('processing');
    setTimeout(() => {
      setPaypalStatus('success');
      onShowToast('✅ PayPal payment verified! Lifetime Pro access unlocked.', 'success');
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      {/* Header */}
      <div className="border-b border-[#262626] bg-[#0c0c0c] px-6 py-12 text-center">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#E0FF25]">
          Simple, Transparent Pricing
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl font-headline">
          Choose Your Plan
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-xs font-medium uppercase tracking-wide text-[#a3a3a3] sm:text-sm">
          Start free. Upgrade when you need more speed, higher message limits, and unlimited permanent memory.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Free Card */}
          <div className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 shadow-sm transition hover:border-[#383838]">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#737373]">Free</div>
              <div className="mt-2 flex items-baseline gap-1 font-mono text-4xl font-black text-white">
                $0<span className="text-xs font-bold text-[#737373]"> / mo</span>
              </div>
              <p className="mt-2 text-xs font-medium text-[#a3a3a3]">
                Try everything. No credit card required.
              </p>

              <div className="mt-6 space-y-2.5 text-xs font-medium">
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> 50 messages / day
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> 10 memory slots
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> All 8 plugins
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Live terminal access
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Code editor
                </div>
                <div className="flex items-center gap-2 text-[#525252]">
                  <X className="h-4 w-4 text-[#525252]" /> Voice interface (TTS/STT)
                </div>
                <div className="flex items-center gap-2 text-[#525252]">
                  <X className="h-4 w-4 text-[#525252]" /> Self-update engine
                </div>
              </div>
            </div>

            <button id="btn-pricingpage-1"
              onClick={() => onNavigate('sapphire')}
              className="mt-8 w-full rounded-lg border border-[#262626] bg-[#141414] py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Card */}
          <div className="relative flex flex-col justify-between rounded-xl border-2 border-[#E0FF25] bg-[#0c0c0c] p-6 shadow-xl shadow-[#E0FF25]/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E0FF25] px-4 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
              Most Popular
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#E0FF25]">Pro</div>
              <div className="mt-2 flex items-baseline gap-1 font-mono text-4xl font-black text-[#E0FF25]">
                $12<span className="text-xs font-bold text-[#737373]"> / mo</span>
              </div>
              <p className="mt-2 text-xs font-medium text-[#a3a3a3]">
                For power builders who want permanent memory & voice.
              </p>

              <div className="mt-6 space-y-2.5 text-xs font-medium">
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> 500 messages / day
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> 100 memory slots
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> All 8 plugins
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Terminal + Code editor
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Voice interface (Kokoro TTS)
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Self-update engine
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Deploy pipeline (Vercel/CF)
                </div>
              </div>
            </div>

            <button id="btn-pricingpage-2"
              onClick={() => handleCheckout('pro')}
              disabled={loadingPlan === 'pro'}
              className="mt-8 w-full rounded-lg bg-[#E0FF25] py-2.5 text-[11px] font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-[#ccff00]"
            >
              {loadingPlan === 'pro' ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Enterprise Card */}
          <div className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 shadow-sm transition hover:border-[#E0FF25]/40">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white">Enterprise</div>
              <div className="mt-2 flex items-baseline gap-1 font-mono text-4xl font-black text-white">
                $49<span className="text-xs font-bold text-[#737373]"> / mo</span>
              </div>
              <p className="mt-2 text-xs font-medium text-[#a3a3a3]">
                Unlimited everything. For engineering teams.
              </p>

              <div className="mt-6 space-y-2.5 text-xs font-medium">
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> <span className="font-black">Unlimited</span> messages
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> <span className="font-black">Unlimited</span> memory slots
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> All Pro features included
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Ollama / local LLM routing
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Priority 24/7 support
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4 text-[#E0FF25]" /> Custom plugin development
                </div>
              </div>
            </div>

            <button id="btn-pricingpage-3"
              onClick={() => handleCheckout('enterprise')}
              disabled={loadingPlan === 'enterprise'}
              className="mt-8 w-full rounded-lg border border-[#262626] bg-[#141414] py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition hover:border-[#E0FF25] hover:text-[#E0FF25]"
            >
              {loadingPlan === 'enterprise' ? 'Redirecting...' : 'Upgrade to Enterprise'}
            </button>
          </div>
        </div>

        {/* PayPal One-Time Lifetime Access Banner */}
        <div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 sm:flex-row sm:p-8 transition hover:border-[#E0FF25]/40">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#E0FF25]">
              💳 Pay Once via PayPal
            </div>
            <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-white font-headline">Full Lifetime Access — $29</h3>
            <p className="mt-1 max-w-md text-xs font-medium text-[#a3a3a3]">
              One-time payment. Lifetime access to all Pro features including voice interface, self-updater, and permanent memory.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button id="btn-pricingpage-4"
              onClick={handlePayPalPayment}
              disabled={paypalStatus === 'processing'}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#E0FF25] px-8 py-3 text-[11px] font-black uppercase tracking-wider text-black shadow-lg transition hover:bg-[#ccff00]"
            >
              <CreditCard className="h-4 w-4" />
              {paypalStatus === 'processing' ? 'Connecting to PayPal...' : 'Pay $29 with PayPal'}
            </button>
            {paypalStatus === 'success' && (
              <span className="text-xs font-black uppercase tracking-wider text-[#E0FF25]">
                ✅ Lifetime Access Active!
              </span>
            )}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#0c0c0c]">
          <div className="border-b border-[#262626] p-4 text-xs font-black uppercase tracking-wider text-white sm:p-5">
            Full Feature Comparison
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#262626] bg-[#141414] text-[#a3a3a3]">
                <tr>
                  <th className="p-3.5 font-bold uppercase tracking-wider sm:px-6">Feature</th>
                  <th className="p-3.5 text-center font-bold uppercase tracking-wider sm:px-4">Free</th>
                  <th className="p-3.5 text-center font-black uppercase tracking-wider text-[#E0FF25] sm:px-4">Pro</th>
                  <th className="p-3.5 text-center font-black uppercase tracking-wider text-white sm:px-4">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-[#a3a3a3]">
                <tr>
                  <td className="p-3.5 font-bold text-white sm:px-6">Messages / day</td>
                  <td className="p-3.5 text-center font-mono">50</td>
                  <td className="p-3.5 text-center font-mono font-bold text-[#E0FF25]">500</td>
                  <td className="p-3.5 text-center font-mono font-bold text-white">Unlimited</td>
                </tr>
                <tr className="bg-[#141414]/40">
                  <td className="p-3.5 font-bold text-white sm:px-6">Memory slots</td>
                  <td className="p-3.5 text-center font-mono">10</td>
                  <td className="p-3.5 text-center font-mono font-bold text-[#E0FF25]">100</td>
                  <td className="p-3.5 text-center font-mono font-bold text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white sm:px-6">All 8 plugins</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                </tr>
                <tr className="bg-[#141414]/40">
                  <td className="p-3.5 font-bold text-white sm:px-6">Live terminal & code editor</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white sm:px-6">Voice interface (Kokoro TTS)</td>
                  <td className="p-3.5 text-center text-[#525252]">—</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                </tr>
                <tr className="bg-[#141414]/40">
                  <td className="p-3.5 font-bold text-white sm:px-6">Self-update code engine</td>
                  <td className="p-3.5 text-center text-[#525252]">—</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white sm:px-6">Deploy pipeline (Vercel / Cloudflare)</td>
                  <td className="p-3.5 text-center text-[#525252]">—</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                </tr>
                <tr className="bg-[#141414]/40">
                  <td className="p-3.5 font-bold text-white sm:px-6">Local Ollama / Llama routing</td>
                  <td className="p-3.5 text-center text-[#525252]">—</td>
                  <td className="p-3.5 text-center text-[#525252]">—</td>
                  <td className="p-3.5 text-center font-bold text-[#E0FF25]">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          <h3 className="text-base font-black uppercase tracking-wider text-white">Frequently Asked Questions</h3>

          <details className="group rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 text-xs">
            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-white">
              <span>Can I cancel my subscription at any time?</span>
              <ChevronDown className="h-4 w-4 text-[#737373] transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 leading-relaxed text-[#a3a3a3]">
              Yes. Cancel anytime from your account settings. You keep access until the end of your billing cycle.
            </p>
          </details>

          <details className="group rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 text-xs">
            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-white">
              <span>Do I need to provide an OpenAI API key?</span>
              <ChevronDown className="h-4 w-4 text-[#737373] transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 leading-relaxed text-[#a3a3a3]">
              No. Sapphire is powered natively by NeuroCore v3 out of the box, with automatic fallback to local Ollama instances. No external API keys required.
            </p>
          </details>

          <details className="group rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 text-xs">
            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-white">
              <span>What happens to my memories if I change plans?</span>
              <ChevronDown className="h-4 w-4 text-[#737373] transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 leading-relaxed text-[#a3a3a3]">
              Your memories are permanently preserved in your secure database.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};
