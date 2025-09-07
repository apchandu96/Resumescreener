// backend/utils/ats.js
/**
 * Universal ATS audit for all roles/industries.
 * - Contact signals: email, phone, LinkedIn/portfolio; placement near top
 * - Sections: summary/objective, experience, education/training, certifications/licenses,
 *   skills/core competencies, projects/portfolio, awards/achievements, languages,
 *   volunteering/community, memberships/affiliations
 * - Dates: range parsing (MM/YYYY, Mon YYYY, YYYY/MM, YYYY), present/current handling,
 *   reverse-chronological check, mixed-format detection, gap detection
 * - Formatting risks: tables/columns/box chars, heavy pipes, excessive spacing, non-ASCII,
 *   scanned/OCR suspicion, photos/headshots
 * - Language/impact: action-verb starts, quantification ($/%/#/time), avoid “responsible for”,
 *   excessive 1st-person, buzzword stuffing
 * - Keywords: exact + fuzzy match vs must/good lists or auto-extracted from JD
 * - Compliance/professionalism: flags sensitive personal data (DOB, marital status, religion, etc.)
 * - Soft vs hard skills balance (suggest adding concrete, role-specific skills)
 *
 * Usage:
 *   const report = runATSAudit(resumeText, {
 *     mustKeywords: [...],          // optional
 *     goodKeywords: [...],          // optional
 *     jobDescriptionText: jdText,   // optional (auto-extracts keywords if provided)
 *   });
 */

export function runATSAudit(resumeText = '', opts = {}) {
  const textRaw = String(resumeText || '');
  const text = normalize(textRaw);
  const lower = text.toLowerCase();

  const {
    mustKeywords = [],
    goodKeywords = [],
    jobDescriptionText = '',
    maxRecommendedPages = 2, // heuristic only; we don't know pages from text
  } = opts;

  /* ---------------- Contact signals ---------------- */
  const emailRx   = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phoneRx   = /(?:\+?\d[\s().-]*)?(?:\d[\s().-]*){7,}\d/g;
  const linkedInRx= /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-z0-9\-_%]+/i;
  const urlRx     = /\bhttps?:\/\/[^\s)]+/ig;
  const imageHints= /(headshot|photo|passport\s*photo|profile\s*photo)/i;

  const hasEmail  = emailRx.test(text);
  const hasPhone  = (text.match(phoneRx) || []).length > 0;
  const linkedIn  = (text.match(linkedInRx) || [])[0] || null;
  const urlsAll   = (text.match(urlRx) || []);
  const otherLinks= urlsAll.filter(u => !/linkedin\.com/i.test(u));
  const header    = lower.slice(0, 700);
  const emailNearTop = hasEmail && /@/.test(header);
  const phoneNearTop = hasPhone && !!header.match(phoneRx);
  const mentionsPhoto = imageHints.test(lower);

  /* ---------------- Section coverage ---------------- */
  const sections = {
    summary: /(summary|objective|profile|professional\s+summary)/i.test(text),
    experience: /(experience|employment|work\s*history|professional\s+experience)/i.test(text),
    education: /(education|training|coursework)/i.test(text),
    certifications: /(certifications?|licenses?|licences?)/i.test(text),
    skills: /(skills?|core\s+competenc(?:e|y|ies))/i.test(text),
    projects: /(projects?|portfolio|case\s*studies|engagements)/i.test(text),
    awards: /(awards?|achievements?|honou?rs?)/i.test(text),
    languages: /(languages?|language\s+proficiency)/i.test(text),
    volunteering: /(volunteering?|community|service)/i.test(text),
    memberships: /(memberships?|affiliations?|associations?)/i.test(text),
  };

  /* ---------------- Bullets / structure ---------------- */
  const bulletChars = ['-', '•', '*', '·', '●', '▪', '■'];
  const bulletLineRx = new RegExp(`(^|\\n)\\s*[${escapeForCharClass(bulletChars.join(''))}]\\s+`, 'g');
  const bulletCount = (text.match(bulletLineRx) || []).length;
  const lines = text.split(/\n+/);
  const bulletLines = lines.filter(l => bulletChars.some(b => l.trim().startsWith(b)));
  const avgBulletLen = average(bulletLines.map(l => l.trim().length));

  /* ---------------- Words / language signals ---------------- */
  const words = (text.match(/\b[\p{L}\p{N}’'-]+\b/gu) || []).length;
  const quantTokens = (text.match(/\b\d+(?:\.\d+)?(?:%|k|m|b)?\b/gi) || []).length +
                      (text.match(/[£$€₹]\s?\d[\d,]*(?:\.\d+)?/g) || []).length;
  const hasPercent = /%/.test(text);
  const firstPerson = (text.match(/\b(i|me|my|mine)\b/gi) || []).length;

  const actionVerbs = new Set([
    // generic, suits many industries
    'led','managed','supervised','oversaw','coordinated','planned','organized','delivered','achieved','improved','increased','reduced','saved',
    'implemented','developed','designed','created','launched','executed','negotiated','sold','grew','trained','mentored','coached','taught',
    'analyzed','audited','assessed','evaluated','inspected','tested','researched','treated','served','supported','assisted','administered',
    'optimized','streamlined','standardized','calibrated','maintained','repaired','installed','operated','produced','manufactured','fabricated',
    'complied','ensured','secured','enforced','documented','reported','presented','collaborated','partnered','facilitated','advised'
  ]);
  const bulletStarts = bulletLines.map(l => (l.replace(/^[-•*·●▪■]+\s*/,'').trim().split(/\s+/)[0] || '').toLowerCase());
  const actionStarts = bulletStarts.filter(w => actionVerbs.has(stripPunct(w))).length;
  const actionVerbRatio = bulletStarts.length ? actionStarts / bulletStarts.length : 0;

  const responsibleFor = (text.match(/\bresponsible\s+for\b/gi) || []).length; // prefer action verbs

  /* ---------------- Formatting risks ---------------- */
  const boxDrawingRx = /[│┆┇┊┋┌┐└┘┬┴┼┤├═║╔╗╚╝]/g;
  const hasBoxChars = boxDrawingRx.test(text);
  const pipeLines = lines.filter(l => (l.match(/\|/g) || []).length >= 2).length; // tables with pipes
  const manyPipes = pipeLines >= 5;
  const multiSpacesLines = lines.filter(l => /\s{5,}/.test(l)).length; // simulating columns via spaces
  const fancyBulletsUsed = /[●▪■]/.test(text);
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  const nonAsciiRatio = nonAscii / Math.max(1, text.length);
  const mixedBulletTypes = new Set(bulletLines.map(l => l.trim()[0])).size >= 2;

  // OCR/scanned suspicion
  const replacementChars = (text.match(/�/g) || []).length;
  const tokens = text.split(/\s+/);
  const avgTokenLen = average(tokens.map(t => t.length));
  const spaceCount = (text.match(/\s/g) || []).length;
  const ocrSuspicion =
    replacementChars > 5 || avgTokenLen > 12 || spaceCount < Math.max(20, words * 0.5);

  /* ---------------- Sensitive personal data (compliance) ---------------- */
  const sensitiveHits = [];
  const SENSITIVE_PATTERNS = [
    /\bdate\s*of\s*birth\b|\bDOB\b/i,
    /\bage\b:\s*\d{1,2}\b/i,
    /\bmarital\s*status\b|\b(single|married|divorced|widowed)\b/i,
    /\breligion\b|\b(caste)\b/i,
    /\bnationality\b|\brace\b|\bethnicity\b/i,
    /\bphoto\b|\bheadshot\b|\bpassport\s*photo\b/i,
    /\bgender\b:\s*(male|female|other|non[-\s]?binary)/i
  ];
  for (const rx of SENSITIVE_PATTERNS) {
    const m = text.match(rx);
    if (m) sensitiveHits.push(m[0]);
  }

  /* ---------------- Dates / ranges / chronology / gaps ---------------- */
  const dateAnalysis = analyzeDates(text);

  /* ---------------- Keywords: JD-driven (any industry) ---------------- */
  const jdKeywords = jobDescriptionText ? extractKeywords(jobDescriptionText) : { must: [], good: [] };

  const targetMust = uniqueStrings([...(mustKeywords || []), ...(jdKeywords.must || []).slice(0, 40)]);
  const targetGood = uniqueStrings([...(goodKeywords || []), ...(jdKeywords.good || []).slice(0, 40)]);
  const keywordMatches = computeKeywordMatches(lower, { must: targetMust, good: targetGood });

  /* ---------------- Soft vs Hard skills balance ---------------- */
  const softSkills = countMatches(lower, SOFT_SKILLS);
  const hardSkills = countMatches(lower, GENERIC_HARD_SKILLS);
  const softVsHardRatio = (softSkills.total + hardSkills.total) > 0
    ? softSkills.total / (softSkills.total + hardSkills.total)
    : 0;

  /* ---------------- Issues & suggestions ---------------- */
  const issues = [];
  const suggestions = [];
  const redFlags = [];

  // Contact
  if (!hasEmail) issues.push('Missing email address.');
  if (!hasPhone) issues.push('Missing phone number.');
  if (!emailNearTop || !phoneNearTop) suggestions.push('Place email and phone in the header/top area.');
  if (!linkedIn) suggestions.push('Add a professional profile link (e.g., LinkedIn or portfolio).');
  if (mentionsPhoto) { redFlags.push('Photo/headshot mentioned.'); suggestions.push('Omit photos to avoid ATS bias/rejection.'); }
  if (urlsAll.length > 4) suggestions.push('Limit links to essential professional profiles (LinkedIn/portfolio).');

  // Sections
  if (!sections.summary) suggestions.push('Add a short Professional Summary (2–3 lines) with role and value proposition.');
  if (!sections.experience) { issues.push('No clear Work Experience section detected.'); redFlags.push('Work Experience missing.'); }
  if (!sections.education) suggestions.push('Add Education/Training with degree/certificates and year.');
  if (!sections.skills) suggestions.push('Add a Skills/Core Competencies section (8–15 job-relevant keywords).');

  // Bullets / structure
  if (bulletCount < 5) suggestions.push('Use 3–5 bullet points per role with measurable outcomes.');
  if (mixedBulletTypes) suggestions.push('Use a single bullet style consistently.');
  if (fancyBulletsUsed) suggestions.push('Avoid fancy bullets; use simple "-" or "•".');
  if (avgBulletLen && avgBulletLen > 280) suggestions.push('Split long bullets into shorter, scannable lines.');

  // Language / impact
  if (words < 350) suggestions.push('Resume may be too short; aim ~500–1000 words across 1–2 pages.');
  if (words > 1700) suggestions.push('Resume may be too long; condense to 1–2 pages and recent impact.');
  if (quantTokens < 4) suggestions.push('Quantify results (%, $, #, time saved) across several bullets.');
  if (actionVerbRatio < 0.5 && bulletStarts.length >= 6) suggestions.push('Start bullets with strong action verbs (led, managed, improved, etc.).');
  if (responsibleFor >= 3) suggestions.push('Replace “responsible for” with action verbs and outcomes.');
  if (firstPerson >= 5) suggestions.push('Minimize first-person pronouns; write concise action statements.');

  // Formatting risks
  if (hasBoxChars || manyPipes || multiSpacesLines > 8) {
    issues.push('Formatting may include tables/columns that some parsers mishandle.');
    suggestions.push('Avoid tables/columns/box characters; use a simple single-column layout.');
  }
  if (nonAsciiRatio > 0.08) suggestions.push('Reduce special symbols; prefer standard ASCII characters.');
  if (ocrSuspicion) { issues.push('Text looks scanned/OCR; parsing accuracy may be poor.'); suggestions.push('Export as real text (DOCX/PDF), not a scanned image.'); }

  // Dates
  if (!dateAnalysis.anyDates) suggestions.push('Include month+year for roles (e.g., Jan 2022 – Mar 2024).');
  if (dateAnalysis.mixedFormats) suggestions.push('Use one consistent date format throughout (e.g., MMM YYYY).');
  if (!dateAnalysis.reverseChronological) suggestions.push('Order roles in reverse-chronological sequence.');
  if (dateAnalysis.gaps.length) {
    const big = dateAnalysis.gaps.find(g => g.months >= 6);
    if (big) suggestions.push(`Address a work gap of ~${big.months} months (brief note, upskilling, projects).`);
  }

  // Sensitive personal data
  if (sensitiveHits.length) {
    redFlags.push('Sensitive personal details present (e.g., DOB/marital status).');
    suggestions.push('Remove sensitive details (DOB, marital status, religion, etc.).');
  }

  // Keywords (any industry)
  if (targetMust.length && keywordMatches.missingMust.length)
    issues.push(`Missing critical keywords: ${keywordMatches.missingMust.slice(0, 10).join(', ')}${ellipsis(keywordMatches.missingMust, 10)}`);
  if (targetGood.length && keywordMatches.missingGood.length)
    suggestions.push(`Consider adding relevant keywords: ${keywordMatches.missingGood.slice(0, 12).join(', ')}${ellipsis(keywordMatches.missingGood, 12)}`);
  if (keywordMatches.overusedBuzz.length)
    suggestions.push(`Reduce vague buzzwords: ${keywordMatches.overusedBuzz.slice(0, 6).join(', ')}.`);

  // Soft vs hard skills
  if (softVsHardRatio > 0.75 && hardSkills.total < 5) {
    suggestions.push('Balance soft skills with concrete, role-specific hard skills and tools.');
  }

  /* ---------------- Scoring (sums to 100) ---------------- */
  const weights = {
    contact: 10,
    sections: 18,
    dates: 16,
    formatting: 16,
    languageImpact: 14,
    keywords: 20,
    compliance: 6
  };

  const cat = {
    contact: scoreBucket([
      [hasEmail, 4], [hasPhone, 4], [emailNearTop, 1], [phoneNearTop, 1]
    ], weights.contact),

    sections: scoreBucket([
      [sections.summary, 3], [sections.experience, 7],
      [sections.education, 3], [sections.skills, 5]
    ], weights.sections),

    dates: scoreBucket([
      [dateAnalysis.anyDates, 5],
      [!dateAnalysis.mixedFormats, 4],
      [dateAnalysis.reverseChronological, 4],
      [dateAnalysis.noBigGaps, 3]
    ], weights.dates),

    formatting: scoreBucket([
      [!hasBoxChars, 5], [!manyPipes, 4], [mixedBulletTypes === false, 3],
      [nonAsciiRatio <= 0.08, 2], [ocrSuspicion === false, 2]
    ], weights.formatting),

    languageImpact: scoreBucket([
      [actionVerbRatio >= 0.5 || bulletStarts.length < 6, 6],
      [quantTokens >= 4, 5],
      [words >= 350 && words <= 1700, 3],
    ], weights.languageImpact),

    keywords: scoreBucket([
      [targetMust.length === 0 || keywordMatches.missingMust.length === 0, 14],
      [keywordMatches.coverage >= 0.6, 6],
    ], weights.keywords),

    compliance: scoreBucket([
      [sensitiveHits.length === 0, 6]
    ], weights.compliance),
  };

  const score = clamp0to100(Math.round(
    cat.contact + cat.sections + cat.dates + cat.formatting + cat.languageImpact + cat.keywords + cat.compliance
  ));

  /* ---------------- Response ---------------- */
  return {
    score,
    redFlags: uniqueStrings(redFlags),
    issues: uniqueStrings(issues),
    suggestions: uniqueStrings(suggestions),
    metrics: {
      wordCount: words,
      bulletPoints: bulletCount,
      avgBulletLength: Math.round(avgBulletLen || 0),
      quantificationTokens: quantTokens,
      hasPercent,
      firstPersonCount: firstPerson,
      actionVerbStarts: actionStarts,
      actionVerbRatio: Number(actionVerbRatio.toFixed(2)),
      contact: {
        hasEmail, hasPhone, linkedIn, otherLinks: otherLinks.slice(0, 5),
        emailNearTop, phoneNearTop, mentionsPhoto
      },
      sections,
      formatting: {
        hasBoxChars, manyPipes, multiSpacesLines, fancyBulletsUsed,
        mixedBulletTypes, nonAsciiRatio: Number(nonAsciiRatio.toFixed(3)),
        ocrSuspicion
      },
      dates: dateAnalysis,
      keywords: {
        coverage: Number(keywordMatches.coverage.toFixed(2)),
        matchedMust: keywordMatches.matchedMust,
        missingMust: keywordMatches.missingMust,
        matchedGood: keywordMatches.matchedGood,
        missingGood: keywordMatches.missingGood,
        overusedBuzz: keywordMatches.overusedBuzz
      },
      softVsHardSkills: {
        softCount: softSkills.total,
        hardCount: hardSkills.total,
        ratioSoft: Number(softVsHardRatio.toFixed(2))
      },
      categoryScores: cat,
      guidance: `Heuristic ATS check for *any* role. Target 1–2 pages (~${maxRecommendedPages}), reverse-chronological roles with consistent Month YYYY dates, simple layout, quantified bullets, and job-relevant keywords.`
    }
  };
}

/* ---------------- Helpers ---------------- */
function normalize(s) {
  return String(s || '')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function average(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function stripPunct(w){ return (w || '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,''); }
function escapeForCharClass(s){ return s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&'); }
function uniqueStrings(arr){ return Array.from(new Set((arr || []).map(s => String(s).trim()).filter(Boolean))); }
function clamp0to100(n){ return Math.max(0, Math.min(100, n)); }
function ellipsis(arr, n){ return (arr.length > n) ? '…' : ''; }

function scoreBucket(checks, weight) {
  const total = checks.reduce((acc, [,w]) => acc + w, 0) || 1;
  const got   = checks.reduce((acc, [ok,w]) => acc + (ok ? w : 0), 0);
  return (got / total) * weight;
}

/* ---------- Dates analysis ---------- */
function analyzeDates(text) {
  const now = new Date();
  const monthWord = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const year = '(?:19|20)\\d{2}';
  const mmYYYY = '(?:0?[1-9]|1[0-2])[\\/-]' + year;
  const yyyyMM = year + '[\\/-](?:0?[1-9]|1[0-2])';
  const monthYYYY = monthWord + '\\s+' + year;
  const bareYear = year;
  const dateLike = `(?:${monthYYYY}|${mmYYYY}|${yyyyMM}|${bareYear})`;
  const rangeRe = new RegExp(`(${dateLike})\\s*(?:–|—|-|to|through|until)?\\s*(?:(${dateLike}|present|current))?`, 'gi');

  const monthIndex = (chunk) => {
    const s = String(chunk || '').toLowerCase().trim();
    let m;
    // Month YYYY
    m = s.match(new RegExp(`^(${monthWord.toLowerCase()})\\s+(${year})$`, 'i'));
    if (m) return (parseInt(m[2],10)*12 + MONTHS[m[1].slice(0,3)]);
    // MM/YYYY
    m = s.match(new RegExp(`^(0?[1-9]|1[0-2])[\\/-](${year})$`, 'i'));
    if (m) return (parseInt(m[2],10)*12 + (parseInt(m[1],10)-1));
    // YYYY/MM
    m = s.match(new RegExp(`^(${year})[\\/-](0?[1-9]|1[0-2])$`, 'i'));
    if (m) return (parseInt(m[1],10)*12 + (parseInt(m[2],10)-1));
    // YYYY
    m = s.match(new RegExp(`^(${year})$`, 'i'));
    if (m) return (parseInt(m[1],10)*12);
    return NaN;
  };

  const matches = [];
  let m;
  while ((m = rangeRe.exec(text)) !== null) {
    const start = monthIndex(m[1]);
    let end = null;
    if (m[2]) {
      const t = m[2].toLowerCase();
      end = /present|current/.test(t) ? (now.getFullYear()*12 + now.getMonth()) : monthIndex(m[2]);
    }
    if (Number.isFinite(start)) matches.push({ start, end: Number.isFinite(end) ? end : start, raw: m[0] });
  }

  const ranges = dedupeRanges(matches).sort((a,b)=> b.start - a.start);

  let reverseChronological = true;
  for (let i=1;i<ranges.length;i++){
    if (ranges[i].start > ranges[i-1].start) { reverseChronological = false; break; }
  }

  const formats = new Set();
  if (new RegExp(mmYYYY,'i').test(text)) formats.add('MM/YYYY');
  if (new RegExp(yyyyMM,'i').test(text)) formats.add('YYYY/MM');
  if (new RegExp(monthYYYY,'i').test(text)) formats.add('Mon YYYY');
  const mixedFormats = formats.size > 1;

  const gaps = [];
  for (let i=0;i<ranges.length-1;i++){
    const newer = ranges[i];
    const older = ranges[i+1];
    const gapMonths = (newer.start - older.end) - 1;
    if (gapMonths >= 3) gaps.push({ between: [i, i+1], months: gapMonths });
  }
  const bigGap = gaps.find(g => g.months >= 6);

  return {
    anyDates: ranges.length > 0,
    mixedFormats,
    reverseChronological,
    noBigGaps: !bigGap,
    gaps,
    rolesDetected: ranges.length,
    ranges: ranges.map(r => ({ startYM: ymToStr(r.start), endYM: ymToStr(r.end), raw: r.raw }))
  };

  function dedupeRanges(arr){
    const seen = new Set(); const out = [];
    for (const r of arr){
      const key = `${r.start}-${r.end}`;
      if (!seen.has(key)){ seen.add(key); out.push(r); }
    }
    return out;
  }
  function ymToStr(n){
    const y = Math.floor(n/12), m = (n%12);
    return `${y}-${String(m+1).padStart(2,'0')}`;
  }
}

const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,sept:8,oct:9,nov:10,dec:11 };

/* ---------- Keyword extraction & matching (industry-agnostic) ---------- */
function extractKeywords(jdText){
  const jd = normalize(jdText || '').toLowerCase();
  const tokens = jd
    .split(/[^a-z0-9+.#\-\/ %]/g).join(' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP.has(w));

  const freq = new Map();
  tokens.forEach(t => freq.set(t, (freq.get(t)||0)+1));
  const sorted = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).map(([w])=>w);

  // Heuristic: "must" = higher-signal hard/role terms; "good" = remainder
  const must = sorted.filter(w => HARD_HINTS.has(w)).slice(0, 60);
  const good = sorted.filter(w => !must.includes(w)).slice(0, 60);
  return { must, good };
}

function computeKeywordMatches(lowerText, { must = [], good = [] }){
  const text = ' ' + lowerText + ' ';
  const norm = (s)=> ' '+s.toLowerCase().trim()+' ';
  const stem = (s)=> s.toLowerCase().replace(/[^a-z0-9+.#\-\/ ]+/g,'').replace(/(ing|ed|es|s)\b/g,'').trim();

  const matcher = (kw)=> {
    const k = kw.toLowerCase().trim();
    if (!k) return false;
    if (text.includes(norm(k))) return true;
    const s = stem(k);
    return s && text.includes(' '+s+' ');
  };

  const matchedMust = uniqueStrings(must.filter(matcher));
  const matchedGood = uniqueStrings(good.filter(matcher));

  const missingMust = uniqueStrings(must.filter(k => !matchedMust.includes(k)));
  const missingGood = uniqueStrings(good.filter(k => !matchedGood.includes(k)));

  const buzz = ['hardworking','team player','self-starter','results-driven','dynamic','go-getter','fast learner','detail-oriented','synergy','passionate'];
  const overusedBuzz = buzz.filter(b => (text.match(new RegExp('\\b'+escapeRegex(b)+'\\b','gi'))||[]).length >= 3);

  const allTargets = uniqueStrings([...must, ...good]);
  const allMatched = uniqueStrings([...matchedMust, ...matchedGood]).length;
  const coverage = allTargets.length ? allMatched / allTargets.length : 1;

  return { matchedMust, missingMust, matchedGood, missingGood, coverage, overusedBuzz };
}

function countMatches(lowerText, dict) {
  let total = 0;
  for (const w of dict) {
    const rx = new RegExp(`\\b${escapeRegex(w)}\\b`, 'g');
    total += (lowerText.match(rx) || []).length;
  }
  return { total };
}

const STOP = new Set([
  'and','or','the','for','with','from','into','to','of','in','on','at','as','by','an','a','be','is','are','was','were',
  'that','this','these','those','we','our','your','you','they','their','them','it','its','will','can','must','should','may',
  'etc','using','use','based','including','across','within','across','various','multiple'
]);

// Industry-agnostic "hard-ish" hints (finance, sales, ops, healthcare, education, manufacturing, hospitality, logistics, legal, design, admin…)
const HARD_HINTS = new Set([
  // Sales/Marketing
  'sales','pipeline','quota','crm','salesforce','hubspot','negotiation','prospecting','closing','b2b','b2c','campaign','seo','sem','ppc','roi','brand',
  'merchandising','marketplace','pricing','promotion','media','content','copywriting','analytics',

  // Finance/Accounting
  'p&l','budget','forecast','variance','audit','compliance','ifrs','gaap','tax','reconciliation','payroll','ap','ar','cashflow','treasury',

  // Operations/Supply Chain/Manufacturing
  'operations','sop','kpi','sla','lean','six sigma','5s','kaizen','tqm','oee','bom','erp','mrp','procurement','inventory','warehousing','fulfillment',
  'scheduling','maintenance','cmms','cmmi','quality','iso','gmp','gxp','capex','opex','throughput','yield','safety','ehs',

  // Logistics/Transport
  'logistics','fleet','routing','dispatch','last mile','3pl','4pl','incoterms','customs','freight','cold chain',

  // Healthcare
  'patient','clinical','diagnosis','treatment','triage','care plan','emr','ehr','hipaa','hl7','icd','cpt','medication','pharmacy','sterile','protocol',

  // Education/Training
  'curriculum','lesson plan','assessment','instruction','pedagogy','classroom management','accreditation','mentoring','training','lms',

  // Hospitality/Retail
  'pos','guest','front desk','housekeeping','f&b','barista','menu','up-selling','inventory control','loss prevention','shift scheduling',

  // Legal/Compliance
  'contract','agreement','nda','litigation','due diligence','regulatory','policy','gdpr','privacy','risk',

  // Admin/HR/People
  'scheduling','calendar','travel','procurement','vendor','recruiting','screening','onboarding','performance','benefits','employee relations',

  // Design/Creative/Trades
  'cad','autocad','solidworks','3ds','adobe','photoshop','illustrator','indesign','premiere','figma','sketch','cnc','welding','carpentry','plumbing','electrical',

  // IT/Tech (kept generic)
  'microsoft office','excel','word','powerpoint','sql','reporting','analytics','data entry','helpdesk','support','troubleshooting','network','security',

  // Data/Science (generic)
  'statistics','hypothesis','experiment','lab','protocol','sop','analysis','report','survey','research',

  // Public sector/Nonprofit
  'grant','fundraising','stakeholder','community outreach','policy','program management'
]);

const GENERIC_HARD_SKILLS = new Set([
  'excel','word','powerpoint','sql','erp','crm','pos','cad','autocad','welding','cnc','bookkeeping','payroll',
  'first aid','forklift','osha','iso','gmp','budgeting','forecasting','inventory','procurement','scheduling',
  'customer service','cash handling','data entry','reporting','presentation','negotiation','sales','teaching'
]);

const SOFT_SKILLS = new Set([
  'communication','teamwork','leadership','adaptability','problem solving','time management','work ethic',
  'creativity','critical thinking','collaboration','attention to detail','flexibility','initiative','empathy',
  'customer focus','multitasking','reliability','positivity'
]);

function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
