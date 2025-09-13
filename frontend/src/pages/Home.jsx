import { Upload, FileText, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <section className="py-12 text-center space-y-10">
      <h2 className="text-3xl font-bold text-slate-900">
        Screen Your Resume Against Jobs Instantly
      </h2>

      <p className="text-slate-600 max-w-2xl mx-auto">
        This tool helps you check how well your CV matches job roles.
        Upload once, paste the job description, and run a quick screening.
      </p>

      {/* --- Demo Flow --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center space-y-3 p-6 bg-white rounded-xl shadow">
          <Upload className="w-10 h-10 text-indigo-600" />
          <h4 className="font-semibold">Step 1: Upload CV</h4>
          <p className="text-sm text-slate-600">
            Upload your resume once (PDF only) and keep it saved in your profile.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 p-6 bg-white rounded-xl shadow">
          <FileText className="w-10 h-10 text-green-600" />
          <h4 className="font-semibold">Step 2: Paste JD</h4>
          <p className="text-sm text-slate-600">
            Paste the job description, focusing on key roles & responsibilities.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 p-6 bg-white rounded-xl shadow">
          <BarChart3 className="w-10 h-10 text-pink-600" />
          <h4 className="font-semibold">Step 3: Run Screening</h4>
          <p className="text-sm text-slate-600">
            Instantly see your match score, summary, and reasons. Last 3 runs are saved.
          </p>
        </div>
      </div>

      {/* --- Detailed Instructions --- */}
      <div className="max-w-xl mx-auto text-left bg-white shadow rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">How it works</h3>
        <ol className="list-decimal list-inside text-slate-700 space-y-2">
          <li><span className="font-medium">Login or register</span> with your email.</li>
          <li><span className="font-medium">Upload your CV</span> once (PDF format recommended).</li>
          <li><span className="font-medium">Paste the job description</span> — focus on <em>key roles and responsibilities</em>.</li>
          <li>
            <span className="font-medium">Run the screening</span> to see:
            <ul className="list-disc list-inside ml-6 mt-1 text-sm">
              <li>Your match score</li>
              <li>A short summary</li>
              <li>Reasons for the score</li>
            </ul>
          </li>
          <li><span className="font-medium">Review history</span> — only your last runs are kept for each CV/role.</li>
        </ol>
      </div>

      <a
        href="/cv"
        className="btn inline-block mt-6"
      >
        Get Started
      </a>
    </section>
  )
}
