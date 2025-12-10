'use client';

import { useState } from "react";

export default function FAQWithSpiral() {
  // FAQ content (edit freely)
  const faqs = [
    {
      q: "How does the Resume AI help me?",
      a: "Our Resume AI analyzes your experience and the job description to tailor your resume, highlighting relevant skills and keywords to pass ATS scans and impress recruiters.",
    },
    {
      q: "Can the Interview AI simulate real interviews?",
      a: "Yes, our Interview AI provides realistic interview simulations with common questions, behavioral scenarios, and technical challenges, offering instant feedback on your responses.",
    },
    {
      q: "How does the Smart Job Matcher work?",
      a: "The Smart Job Matcher uses AI to analyze your resume and preferences, then scours thousands of job postings to find the most relevant opportunities, saving you time and effort.",
    },
    {
      q: "Is my personal data safe with Job AI?",
      a: "Absolutely. We prioritize your privacy and security. All your data is encrypted and stored securely, and we never share your information with third parties without your consent.",
    },
    {
      q: "Can I get feedback on my resume before applying?",
      a: "Yes, our Resume AI provides detailed feedback on your resume's structure, content, and keywords, helping you optimize it for specific job applications.",
    },
    {
      q: "How accurate is the Interview AI's feedback?",
      a: "Our Interview AI's feedback is highly accurate, leveraging advanced natural language processing to evaluate your communication, confidence, and relevance of answers against best practices.",
    },
  ];

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white bg-black"
    >
      {/* Layout */}
      <div className="relative mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <header className="mb-10 flex items-end justify-between border-b border-white/20 pb-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">FAQ</h1>
            <p className="mt-2 text-sm md:text-base text-white/70">
              Frequently Asked Questions
            </p>
          </div>
        </header>

        {/* Content */}
        <section className="relative">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} index={i + 1} />
            ))}
          </div>
        </section>
      </div>      
    </div>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 p-5 transition hover:border-white/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-xs text-white/40">{String(index).padStart(2, "0")}</span>
          <h3 className="text-base md:text-lg font-semibold leading-tight">{q}</h3>
        </div>
        <span className="ml-4 text-white/60 transition group-hover:text-white">{open ? "–" : "+"}</span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${open ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="text-sm text-white/70">{a}</p>
        </div>
      </div>
      {/* Hover halo */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100">
        <div
          className="absolute -inset-1 rounded-2xl border border-white/10"
          style={{ maskImage: "radial-gradient(180px_180px_at_var(--x,50%)_var(--y,50%),white,transparent)" }}
        />
      </div>
    </div>
  );
}

