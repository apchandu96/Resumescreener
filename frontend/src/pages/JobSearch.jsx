// frontend/src/pages/JobSearch.jsx
import { useEffect, useMemo, useState } from 'react'
import { searchJobs, whereAmI } from '../api'

/* =====================================
   Helpers
===================================== */
const SALARY_STEPS = 10000
const SALARY_MAX = 200000
const salaryOptions = (() => {
  const opts = [{ label: 'Any salary', value: '' }]
  for (let min = 0; min < SALARY_MAX; min += SALARY_STEPS) {
    const max = min + SALARY_STEPS
    opts.push({ label: `£${min.toLocaleString()} - £${max.toLocaleString()}`, value: `${min}-${max}` })
  }
  opts.push({ label: `£${SALARY_MAX.toLocaleString()}+`, value: `${SALARY_MAX}+` })
  return opts
})()

function parseSalaryRange(val) {
  if (!val) return { minimumSalary: undefined, maximumSalary: undefined }
  if (val.endsWith('+')) return { minimumSalary: Number(val.replace('+', '')), maximumSalary: undefined }
  const [a, b] = val.split('-').map(Number)
  return { minimumSalary: isNaN(a) ? undefined : a, maximumSalary: isNaN(b) ? undefined : b }
}

const JOB_TYPES = [
  { label: 'Any type', value: '' },
  { label: 'Full-time', value: 'fullTime' },
  { label: 'Part-time', value: 'partTime' },
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temp', value: 'temp' },
]

function formatSalary(min, max) {
  if (min || max) {
    const sMin = min ? `£${Number(min).toLocaleString()}` : '—'
    const sMax = max ? `£${Number(max).toLocaleString()}` : '—'
    return `${sMin} - ${sMax} a year`
  }
  return 'Salary not disclosed'
}
function formatPosted(dateLike) {
  if (!dateLike) return ''
  const d = new Date(dateLike)
  return isNaN(d) ? '' : d.toLocaleDateString()
}

/* =====================================
   Accordion Card
===================================== */
function JobAccordionCard({ job, isOpen, onToggle, idx }) {
  const tags = []
  if (job.fullTime) tags.push('Full-time')
  if (job.partTime) tags.push('Part-time')
  if (job.permanent) tags.push('Permanent')
  if (job.contract) tags.push('Contract')
  if (job.temp) tags.push('Temp')

  const panelId = `job-panel-${idx}`

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header / trigger */}
      <button
        onClick={onToggle}
        className={`w-full text-left p-4 md:p-5 transition ${isOpen ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">{job.jobTitle}</h3>
            <div className="text-sm text-slate-600">
              {job.employerName && <span>{job.employerName}</span>}
              {job.locationName && <span className="text-slate-500">{job.employerName ? ' • ' : ''}{job.locationName}</span>}
            </div>
          </div>
          <div className="shrink-0 text-sm text-slate-800">{formatSalary(job.minimumSalary, job.maximumSalary)}</div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {tags.map(t => (
            <span key={t} className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {t}
            </span>
          ))}
          {(job.created || job.datePosted) && (
            <span className="text-slate-500 ml-auto">Posted {formatPosted(job.created || job.datePosted)}</span>
          )}
        </div>
      </button>

      {/* Content */}
      <div
        id={panelId}
        role="region"
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-5 pb-5">
            <hr className="my-4" />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-700">
                <div><b>Company:</b> {job.employerName || '—'}</div>
                <div><b>Location:</b> {job.locationName || '—'}</div>
                <div><b>Salary:</b> {formatSalary(job.minimumSalary, job.maximumSalary)}</div>
              </div>
              <div className="mt-2 md:mt-0">
                <a
                  className="btn btn-primary"
                  href={job.jobUrl || job.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open job
                </a>
              </div>
            </div>

            <h4 className="font-semibold text-slate-800 mt-4 mb-2">Job description</h4>
            <div className="text-slate-800 text-sm leading-6 whitespace-pre-wrap">
              {job.jobDescription || 'No description provided.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =====================================
   Page
===================================== */
export default function JobSearch() {
  // data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)

  // filters (two rows: keywords+location, then salary+type+button)
  const [keywords, setKeywords] = useState('')
  const [locationName, setLocationName] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [jobType, setJobType] = useState('')

  // paging
  const [skip, setSkip] = useState(0)
  const take = 20

  // detected city
  const [detectedCity, setDetectedCity] = useState('')

  // accordion state (only one open at a time; click again to close)
  const [openIndex, setOpenIndex] = useState(-1)
  const toggleIndex = (idx) => setOpenIndex(prev => (prev === idx ? -1 : idx))

  async function load(initial = false) {
    setLoading(true); setError(null)
    try {
      const { minimumSalary, maximumSalary } = parseSalaryRange(salaryRange)
      const typeFlags = {
        fullTime: jobType === 'fullTime' ? true : undefined,
        partTime: jobType === 'partTime' ? true : undefined,
        permanent: jobType === 'permanent' ? true : undefined,
        contract: jobType === 'contract' ? true : undefined,
        temp: jobType === 'temp' ? true : undefined,
      }
      const params = {
        keywords: keywords.trim(),
        locationName: locationName.trim() || undefined,
        minimumSalary,
        maximumSalary,
        ...typeFlags,
        distanceFromLocation: 10,
        resultsToTake: take,
        resultsToSkip: initial ? 0 : skip,
      }
      const data = await searchJobs(params)
      const list = data?.results || data?.jobs || []
      setJobs(list)
      setTotal(data?.totalResults || data?.count || list.length)
      setOpenIndex(-1) // collapse on new search or page change
    } catch (e) {
      setError(String(e))
      setJobs([]); setTotal(0); setOpenIndex(-1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    whereAmI()
      .then(info => {
        const city = info?.geo?.city
        if (city && !locationName) setDetectedCity(city)
      })
      .catch(() => {})
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSearch = (e) => { e?.preventDefault?.(); setSkip(0); load(true) }
  const nextPage = () => { const ns = skip + take; setSkip(ns); load(false) }
  const prevPage = () => { const ns = Math.max(0, skip - take); setSkip(ns); load(false) }

  return (
    <div className="space-y-6">
      {/* Filters card */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Job Search</h2>

        {/* Two rows: Row1 (keywords + location), Row2 (salary + type + button) */}
        <form onSubmit={onSearch} className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Row 1 */}
          <div className="md:col-span-7">
            <label className="label" htmlFor="kw">Keywords</label>
            <input
              id="kw"
              className="input w-full"
              placeholder="e.g., React developer"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            />
          </div>
          <div className="md:col-span-5">
            <label className="label" htmlFor="loc">
              Location
            </label>
            <input
              id="loc"
              className="input w-full"
              placeholder="e.g., London"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
            />
          </div>

          {/* Row 2 */}
          <div className="md:col-span-4">
            <label className="label" htmlFor="sal">Salary</label>
            <select
              id="sal"
              className="input w-full"
              value={salaryRange}
              onChange={e => setSalaryRange(e.target.value)}
            >
              {salaryOptions.map(o => (
                <option key={o.value || 'any'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="label" htmlFor="type">Job type</label>
            <select
              id="type"
              className="input w-full"
              value={jobType}
              onChange={e => setJobType(e.target.value)}
            >
              {JOB_TYPES.map(t => (
                <option key={t.value || 'any'} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex items-end">
            <button className="btn btn-primary w-full md:w-auto" type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Result summary + paging */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Results: {total}</div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={prevPage} disabled={loading || skip === 0}>Prev</button>
          <button className="btn btn-primary" onClick={nextPage} disabled={loading || skip + 20 >= total}>Next</button>
        </div>
      </div>

      {/* Jobs list (accordion) */}
      <div className="space-y-3">
        {jobs.map((j, idx) => (
          <JobAccordionCard
            key={j.jobId || j.id || `${j.employerName}-${j.jobTitle}-${idx}`}
            job={j}
            idx={idx}
            isOpen={openIndex === idx}
            onToggle={() => toggleIndex(idx)}
          />
        ))}
        {!loading && jobs.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            No jobs found. Try changing filters.
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3">
          {error}
        </div>
      )}
    </div>
  )
}
