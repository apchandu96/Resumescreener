# Resume Screener (MERN)

Mobile-first MERN app to upload **PDF** CVs, add job roles, **extract skills** via an LLM, and **screen** your CV against roles.
Keeps the **last 3** screening results per Candidate+Role.

## Requirements
- Node 18+
- MongoDB running locally (default URL: `mongodb://localhost:27017/resumescreener`)

## Backend
```bash
cd backend
cp .env.example .env   # fill in SKILL_*/SCORING_* URLs + keys
npm install
npm run dev            # http://localhost:5199
```

## Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Flow
1) **Home** → Get Started → **My CV**
2) **My CV** → upload PDF + name + years (multiple CVs allowed)
3) **Job Roles** → title + JD (required) → **Extract skills** → Save role → prompt to **Screen now**
4) **Screening** → pick CV + Role → Score → See summary/reasons/flags → history keeps **last 3**

### Backend ENV (`backend/.env`)
```
PORT=5199
MONGO_URL=mongodb://localhost:27017/resumescreener

# Skill extraction model
SKILL_MODEL_URL=https://api.openai.com/v1/chat/completions
SKILL_MODEL_KEY=sk-...

# Scoring model
SCORING_MODEL_URL=https://api.openai.com/v1/chat/completions
SCORING_MODEL_KEY=sk-...
```
