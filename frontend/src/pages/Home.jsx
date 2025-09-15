import { Link } from 'react-router-dom'
import {
  Upload,
  ClipboardList,
  Gauge,
  Search,
  Sparkles,
  ChevronDown
} from 'lucide-react'

export default function Home() {
  return (
    <div className="relative min-h-screen isolate overflow-hidden">
      {/* Full-bleed soft gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-rose-50 to-emerald-50" />
      {/* Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl" />

      {/* HERO */}
      <section className="w-full px-6 md:px-10 pt-12 pb-6 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 shadow-sm ring-1 ring-black/5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-xs text-slate-700">We leave no chance for your CV to be rejected by recruiters</span>
        </div>

       <h1 className="mt-4 font-extrabold leading-tight text-slate-900">
  {/* Mobile (short) */}
  <span className="block text-3xl md:hidden">
    Progress your career — we handle the first step.
  </span>
  {/* Desktop (longer) */}
  <span className="hidden md:block text-5xl md:text-6xl">
    Your career deserves progress. We ensure the first step is effortless.
  </span>
</h1>

        <p className="mt-3 text-slate-600 md:text-lg">
          Upload your CV, paste a job role, and get instant ATS screening and match scores.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/cv" className="btn">
            Get Started
          </Link>
          <Link to="/jobs" className="btn btn-outline">
            Try Job Search
          </Link>
        </div>
      </section>

      {/* FLOW — DESKTOP (full width) */}
      <section className="hidden md:block w-full pb-16">
        {/* Edge-to-edge grid (fills the page width) */}
        <div className="grid grid-cols-12 gap-6 px-6 md:px-10">
          <StepCard
            className="col-span-3"
            gradient="from-indigo-500 to-indigo-600"
            icon={<Upload className="h-7 w-7" />}
            step="Step 1"
            title="Upload CV"
            caption="Automatic ATS checks"
            to="/cv"
          />
          <StepCard
            className="col-span-3"
            gradient="from-emerald-500 to-emerald-600"
            icon={<ClipboardList className="h-7 w-7" />}
            step="Step 2"
            title="Paste Role"
            caption="Key roles & responsibilities only"
            to="/roles"
          />
          <StepCard
            className="col-span-3"
            gradient="from-fuchsia-500 to-pink-600"
            icon={<Gauge className="h-7 w-7" />}
            step="Step 3"
            title="Screen & Score"
            caption="Match CV ↔ JD & see results"
            to="/screening"
          />
          <StepCard
            className="col-span-3"
            gradient="from-amber-500 to-orange-600"
            icon={<Search className="h-7 w-7" />}
            step="Step 4"
            title="Job Search"
            caption="Match in one place — no tab hopping"
            to="/jobs"
          />
        </div>
      </section>

      {/* FLOW — MOBILE (vertical stepper) */}
      <section className="md:hidden w-full px-4 pb-16">
        <MobileStep
          gradient="from-indigo-500 to-indigo-600"
          icon={<Upload className="h-6 w-6" />}
          step="Step 1"
          title="Upload CV"
          caption="Automatic ATS checks"
          to="/cv"
        />
        <DownArrow />
        <MobileStep
          gradient="from-emerald-500 to-emerald-600"
          icon={<ClipboardList className="h-6 w-6" />}
          step="Step 2"
          title="Paste Role"
          caption="Key roles & responsibilities only"
          to="/roles"
        />
        <DownArrow />
        <MobileStep
          gradient="from-fuchsia-500 to-pink-600"
          icon={<Gauge className="h-6 w-6" />}
          step="Step 3"
          title="Screen & Score"
          caption="Match CV ↔ JD & see results"
          to="/screening"
        />
        <DownArrow />
        <MobileStep
          gradient="from-amber-500 to-orange-600"
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

function StepCard({ className = '', gradient, icon, step, title, caption, to }) {
  return (
    <Link
      to={to}
      className={`group relative h-64 rounded-3xl bg-white/90 shadow-lg ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${className}`}
    >
      {/* gradient corner glow */}
      <div
        className={`absolute -z-10 -inset-1 rounded-3xl bg-gradient-to-br ${gradient} opacity-20 blur-2xl transition group-hover:opacity-30`}
      />
      <div className="flex h-full flex-col justify-between p-6">
        <div className="flex items-center gap-3">
          <div className={`grid place-items-center rounded-2xl bg-gradient-to-br ${gradient} p-3 text-white shadow-inner`}>
            {icon}
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-black/5">
            {step}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
          <p className="mt-1 text-slate-600">{caption}</p>
        </div>

        <div className="flex items-center justify-end">
          <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-white transition group-hover:bg-slate-900">
            Continue →
          </span>
        </div>
      </div>
    </Link>
  )
}

function MobileStep({ gradient, icon, step, title, caption, to }) {
  return (
    <Link
      to={to}
      className="group relative mb-3 block rounded-2xl bg-white/90 p-5 shadow-md ring-1 ring-black/5 transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
    >
      <div className="flex items-center gap-3">
        <div className={`grid place-items-center rounded-2xl bg-gradient-to-br ${gradient} p-3 text-white shadow-inner`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{step}</div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          <div className="text-sm text-slate-600">{caption}</div>
        </div>
        <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-white transition group-hover:bg-slate-900">
          Go →
        </span>
      </div>
    </Link>
  )
}

function DownArrow() {
  return (
    <div className="mb-3 flex items-center justify-center">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-white shadow ring-1 ring-black/5">
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  )
}
