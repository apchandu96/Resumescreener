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

export async function scoreCandidateLLM(candidate, role) {
  const url = process.env.SCORING_MODEL_URL
  const key = process.env.SCORING_MODEL_KEY
  if (!url || !key) throw new Error('Scoring model URL/key missing')
  const prompt = `Compare candidate to role. Return {"score":0-100,"summary":"","reasons":[],"flags":[]} ONLY.

ROLE:
Title: ${role.title}
Description: ${role.description}
Must: ${(role.mustHaveSkills||[]).join(', ')}
Good: ${(role.goodToHaveSkills||[]).join(', ')}

CANDIDATE:
Name: ${candidate.name}
YearsExperience: ${candidate.yearsExperience}
Resume (truncated):
${(candidate.resumeText||'').slice(0, 8000)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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
  try { return JSON.parse(json.choices[0].message.content) }
  catch { return { score: 0, summary: '', reasons: [], flags: [] } }
}


export async function atsScoreLLM(resumeText = "") {
  const url = process.env.SKILL_MODEL_URL;
  const key = process.env.SKILL_MODEL_KEY;
  if (!url || !key) throw new Error("Skill model URL/key missing");

  const prompt = `You are an ATS expert. Evaluate this resume for ATS-friendliness.
Return STRICT JSON only:
{"score":0-100,"issues":[],"suggestions":[],"signals":{"hasEmail":bool,"hasPhone":bool,"hasSummary":bool,"hasExperience":bool,"hasEducation":bool,"hasSkills":bool,"bulletCount":number,"estimatedWords":number}}.

RESUME:
${resumeText.slice(0, 12000)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return strict JSON only. No explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    const err = new Error(`Upstream error ${res.status}`);
    err.status = res.status;
    err.details = await res.text().catch(()=>null);
    throw err;
  }
  const json = await res.json();
  try { return JSON.parse(json.choices[0].message.content); }
  catch { return { score: 0, issues: ["Invalid JSON from model"], suggestions: [], signals: {} }; }
}
