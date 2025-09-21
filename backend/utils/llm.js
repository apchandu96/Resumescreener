import fetch from 'node-fetch'

function ensureOk(res) {
  if (!res.ok) {
    const e = new Error(`Upstream error ${res.status}`)
    e.status = res.status
    return e
  }
  return null
}

export async function extractSkillsLLM(title, description) {
  const url = process.env.SKILL_MODEL_URL
  const key = process.env.SKILL_MODEL_KEY
  if (!url || !key) throw new Error('Skill model URL/key missing')

  const prompt = `From the job description, extract:
1) must_have_skills: array of concise skill keywords (lowercase, no duplicates).
2) good_to_have_skills: array of concise skill keywords.
Return strict JSON: {"must_have_skills":[], "good_to_have_skills":[]}.

TITLE: ${title}
DESCRIPTION:
${description}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return strict JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  })
  const maybeErr = ensureOk(res); const json = await res.json()
  if (maybeErr) { maybeErr.details = json; throw maybeErr }
  try { return JSON.parse(json.choices[0].message.content) }
  catch { return { must_have_skills: [], good_to_have_skills: [] } }
}

/**
 * Rich comparison that returns detailed matched/missing sets + suggestions.
 */
export async function scoreCandidateLLM(candidate, role) {
  const url = process.env.SCORING_MODEL_URL
  const key = process.env.SCORING_MODEL_KEY
  if (!url || !key) throw new Error('Scoring model URL/key missing')

  const prompt = `You are a technical recruiter. Compare the candidate to the role and return STRICT JSON ONLY with fields:
{
  "score": 0-100,
  "summary": string,
  "matched_must": string[],         // which must-haves are clearly evidenced in the resume
  "missing_must": string[],         // must-haves not evidenced
  "matched_good": string[],         // which nice-to-haves are evidenced
  "missing_good": string[],         // nice-to-haves not evidenced
  "cv_suggestions": string[],       // concrete, resume-ready suggestions (actionable bullet phrasing)
  "role_specific_gaps": string[],   // narrative of gaps to address for this role
  "flags": string[]                 // risk items (employment gaps, unclear scope, title mismatch, etc.)
}

Rules:
- Match skills only if the resume provides explicit evidence (keywords, projects, accomplishments). Avoid false positives.
- Keep lists concise; use lowercase keywords for skill lists.
- Score from 0 to 100 reflecting must-have coverage first, then good-to-haves, then seniority/impact alignment.

ROLE:
Title: ${role.title}
Description: ${role.description}
Must: ${(role.mustHaveSkills||[]).join(', ')}
Good: ${(role.goodToHaveSkills||[]).join(', ')}

CANDIDATE:
Name: ${candidate.name}
YearsExperience: ${candidate.yearsExperience}
Resume (truncated to 8000 chars):
${(candidate.resumeText||'').slice(0, 8000)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'Return strict JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  })
  const maybeErr = ensureOk(res); const json = await res.json()
  if (maybeErr) { maybeErr.details = json; throw maybeErr }
  try {
    return JSON.parse(json.choices[0].message.content)
  } catch {
    return {
      score: 0, summary: '',
      matched_must: [], missing_must: [],
      matched_good: [], missing_good: [],
      cv_suggestions: [], role_specific_gaps: [], flags: []
    }
  }
}

export async function atsScoreLLM(resumeText = "") {
  const url = process.env.SKILL_MODEL_URL
  const key = process.env.SKILL_MODEL_KEY
  if (!url || !key) throw new Error("Skill model URL/key missing")

  const prompt = `You are an ATS expert. Evaluate this resume for ATS-friendliness.
Return STRICT JSON only:
{"score":0-100,"issues":[],"suggestions":[],"signals":{"hasEmail":bool,"hasPhone":bool,"hasSummary":bool,"hasExperience":bool,"hasEducation":bool,"hasSkills":bool,"bulletCount":number,"estimatedWords":number}}.

RESUME:
${resumeText.slice(0, 12000)}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Return strict JSON only. No explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  })

  if (!res.ok) {
    const err = new Error(`Upstream error ${res.status}`)
    err.status = res.status
    err.details = await res.text().catch(()=>null)
    throw err
  }
  const json = await res.json()
  try { return JSON.parse(json.choices[0].message.content) }
  catch { return { score: 0, issues: ["Invalid JSON from model"], suggestions: [], signals: {} } }
}

/**
 * Optional: one helper your route/controller can call to produce the final payload
 */
export async function screenCandidateCombined(candidate, role) {
  const [fit, ats] = await Promise.all([
    scoreCandidateLLM(candidate, role),
    atsScoreLLM(candidate.resumeText || '')
  ])

  return {
    // keep existing keys for compatibility
    score: fit.score,
    summary: fit.summary,
    flags: fit.flags || [],
    // new detail
    matched_must: fit.matched_must || [],
    missing_must: fit.missing_must || [],
    matched_good: fit.matched_good || [],
    missing_good: fit.missing_good || [],
    cv_suggestions: fit.cv_suggestions || [],
    role_specific_gaps: fit.role_specific_gaps || [],
    // ats block
    ats
  }
}
