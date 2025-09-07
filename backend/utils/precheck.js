// backend/utils/precheck.js
// Deterministic precheck: match resumeText against role's must/good skills.
// Optionally checks minYears / requiredCerts if you add them to your Role schema later.

export function precheckResumeAgainstRole({ resumeText = '', yearsExperience = 0 }, role = {}) {
  const text = norm(resumeText).toLowerCase();

  const must = Array.isArray(role.mustHaveSkills) ? role.mustHaveSkills : [];
  const good = Array.isArray(role.goodToHaveSkills) ? role.goodToHaveSkills : [];

  // Optional fields (future-friendly; safe if absent)
  const minYears = Number(role.minYears || 0);
  const reqCerts  = Array.isArray(role.requiredCerts) ? role.requiredCerts : [];

  const mustResult = matchList(text, must);
  const goodResult = matchList(text, good);
  const certResult = matchList(text, reqCerts);

  const yearsOk = !minYears || Number(yearsExperience || 0) >= minYears;
  const certsOk = reqCerts.length === 0 || certResult.missing.length === 0;

  const pass = mustResult.missing.length === 0 && yearsOk && certsOk;

  return {
    pass,
    coverage: {
      must: ratio(mustResult.found.length, must.length),
      good: ratio(goodResult.found.length, good.length),
    },
    found: {
      must: mustResult.found,
      good: goodResult.found,
      certs: certResult.found
    },
    missing: {
      must: mustResult.missing,
      good: goodResult.missing,
      certs: certResult.missing
    },
    checks: {
      minYearsRequired: minYears || null,
      candidateYears: Number(yearsExperience || 0),
      yearsOk,
      certsOk
    },
    notes: buildNotes({ mustResult, goodResult, yearsOk, certsOk, minYears, reqCerts })
  };
}

/* ---------------- helpers ---------------- */

function norm(s){ return String(s || '').replace(/\r/g, '\n'); }

function tokenizeSkill(s){
  // Normalizes skill tokens for a fuzzy-ish match
  return String(s || '').toLowerCase().trim();
}

function matchList(text, arr){
  const found = [];
  const missing = [];
  for (const raw of arr){
    const kw = tokenizeSkill(raw);
    if (!kw) continue;

    // exact or fuzzy contains (simple)
    const ok = contains(text, kw);
    if (ok) found.push(raw);
    else missing.push(raw);
  }
  return { found, missing };
}

function contains(text, kw){
  // Try exact substring
  if (text.includes(` ${kw} `) || text.includes(` ${kw}\n`) || text.includes(`\n${kw} `) || text.includes(kw)) {
    return true;
  }
  // Light fuzzy: collapse punctuation/extra spaces
  const t = text.replace(/[^a-z0-9+.#\-\/ ]+/g, ' ').replace(/\s+/g, ' ');
  const k = kw.replace(/[^a-z0-9+.#\-\/ ]+/g, ' ').replace(/\s+/g, ' ');
  return t.includes(` ${k} `) || t.includes(` ${k}`) || t.startsWith(k) || t.endsWith(k);
}

function ratio(a, b){ return b ? Number((a/b).toFixed(2)) : 1; }

function buildNotes({ mustResult, goodResult, yearsOk, certsOk, minYears, reqCerts }){
  const notes = [];
  if (!yearsOk && minYears) notes.push(`Requires ≥ ${minYears} years experience.`);
  if (!certsOk && (reqCerts || []).length) notes.push(`Required certifications missing.`);
  if (mustResult.missing.length) notes.push(`Missing must-have skills: ${mustResult.missing.slice(0, 10).join(', ')}${mustResult.missing.length > 10 ? '…' : ''}`);
  if (!mustResult.missing.length && goodResult.missing.length) {
    notes.push(`Consider adding relevant keywords: ${goodResult.missing.slice(0, 10).join(', ')}${goodResult.missing.length > 10 ? '…' : ''}`);
  }
  return notes;
}
