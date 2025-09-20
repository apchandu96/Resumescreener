import { Link } from 'react-router-dom'
import {
  Upload,
  FileText,
  Gauge,
  Search,
  Sparkles,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* HERO — clean white, darker text */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 md:px-10 pt-12 pb-10 text-center">
          {/* Small badge */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200">
            <Sparkles className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-700">
              We leave no chance for your CV to be rejected by recruiters
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-5 font-extrabold leading-tight text-slate-900">
            <span className="block text-3xl md:hidden">
              Progress your career — we handle the first step.
            </span>
            <span className="hidden md:block text-5xl md:text-6xl">
              Your career deserves progress. We ensure the first step is effortless.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base md:text-lg text-slate-600">
            Upload your CV, paste a job role, and get instant ATS screening and match scores.
          </p>

          {/* CTAs: primary (solid blue), secondary (outline blue) */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/cv" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/jobs" className="btn btn-secondary">
              Try Job Search
            </Link>
          </div>
        </div>
      </section>

      {/* FLOW — DESKTOP: wider cards (2 per row) */}
      <section className="w-full py-12">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="hidden md:grid grid-cols-2 gap-6">
            <StepCard
              icon={<Upload className="h-6 w-6" />}
              step="Step 1"
              title="Upload CV"
              caption="Automatic ATS checks"
              to="/cv"
            />
            <StepCard
              icon={<FileText className="h-6 w-6" />}
              step="Step 2"
              title="Paste Role"
              caption="Key roles & responsibilities"
              to="/roles"
            />
            <StepCard
              icon={<Gauge className="h-6 w-6" />}
              step="Step 3"
              title="Screen & Score"
              caption="Match CV ↔ JD & see results"
              to="/screening"
            />
            <StepCard
              icon={<Search className="h-6 w-6" />}
              step="Step 4"
              title="Job Search"
              caption="Match in one place — no tab hopping"
              to="/jobs"
            />
          </div>
        </div>
      </section>

      {/* FLOW — MOBILE: stacked, simple */}
      <section className="md:hidden w-full px-4 pb-16">
        <MobileStep
          icon={<Upload className="h-6 w-6" />}
          step="Step 1"
          title="Upload CV"
          caption="Automatic ATS checks"
          to="/cv"
        />
        <MobileStep
          icon={<FileText className="h-6 w-6" />}
          step="Step 2"
          title="Paste Role"
          caption="Key roles & responsibilities"
          to="/roles"
        />
        <MobileStep
          icon={<Gauge className="h-6 w-6" />}
          step="Step 3"
          title="Screen & Score"
          caption="Match CV ↔ JD & see results"
          to="/screening"
        />
        <MobileStep
          icon={<Search className="h-6 w-6" />}
          step="Step 4"
          title="Job Search"
          caption="All matches in one place"
          to="/jobs"
        />
      </section>
    </div>
  )
}

/* ================= Helpers ================= */

function StepCard({ icon, step, title, caption, to }) {
  return (
    <Link
      to={to}
      className="group relative flex items-center gap-5 rounded-2xl bg-white border border-slate-200 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C022F]"
    >
      {/* Icon pill in brand blue */}
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#0C022F] text-white shadow-inner">
        {icon}
      </div>

      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {step}
        </div>
        <div className="mt-0.5 text-xl font-extrabold text-slate-900">
          {title}
        </div>
        <div className="mt-1 text-slate-600">
          {caption}
        </div>
      </div>

      <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 transition group-hover:border-slate-400">
        Go →
      </span>
    </Link>
  )
}

function MobileStep({ icon, step, title, caption, to }) {
  return (
    <Link
      to={to}
      className="group relative mb-3 block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C022F]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0C022F] text-white shadow-inner">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {step}
          </div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          <div className="text-sm text-slate-600">{caption}</div>
        </div>
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 transition group-hover:border-slate-400">
          Go →
        </span>
      </div>
    </Link>
  )
}
