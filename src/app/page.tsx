export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl mx-auto py-12 px-6 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Expense Checker
          </h1>
          <p className="text-sm text-zinc-500">
            AI-powered expense compliance — submit, review, and approve expense reports against company policy.
          </p>
        </div>

        {/* Employee flow */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Employee Flow</h2>
          <ol className="flex flex-col gap-4">
            <Step n={1} title="Log in">
              Select your account from the login screen or create a new one. Your role (Active or Admin) determines which sections you can access.
            </Step>
            <Step n={2} title="Submit an expense report">
              Go to <strong>Add Expense Report</strong>. Enter the vendor, amount, category, and description. You can optionally upload a receipt image — the system will parse it and pre-fill the form. Mark the expense as a client charge if applicable, then submit.
            </Step>
            <Step n={3} title="Track your submissions">
              Go to <strong>View Expenses Report</strong> to see all expense reports you have submitted along with their current status and any compliance analysis results.
            </Step>
          </ol>
        </section>

        {/* Admin flow */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Admin Flow</h2>
          <ol className="flex flex-col gap-4">
            <Step n={1} title="Manager approval">
              On the <strong>Ready for Compliance Check</strong> page, review submitted expenses. Check the <em>Approved by Manager</em> checkbox on any expense to record your approval — this automatically stamps the report with your name. Once you are satisfied with the selection, send the chosen expenses to the compliance agent.
            </Step>
            <Step n={2} title="Compliance analysis">
              The compliance agent runs each selected expense against the active policy documents using AI. It returns a verdict of <strong>Approved</strong>, <strong>Flagged</strong>, or <strong>Denied</strong> along with reasoning and specific policy citations.
            </Step>
            <Step n={3} title="Manual review (flagged expenses)">
              Expenses the agent flags for human review appear on the <strong>Needs Manual Review</strong> page. Expand an expense to read the agent&apos;s reasoning and policy citations, then click <strong>Approve</strong> or <strong>Deny</strong>. Your decision is recorded as the final reviewer.
            </Step>
            <Step n={4} title="Completed">
              The <strong>Completed</strong> page shows all expenses with a final verdict of Approved or Denied, including who submitted them, who approved them at each stage, and the confidence score from the compliance agent.
            </Step>
          </ol>
        </section>

        {/* Policy management */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Policy Management (Admin)</h2>
          <ul className="flex flex-col gap-3">
            <Bullet title="Upload a New Policy Document">
              Add or replace company expense policy documents. Uploaded documents are chunked and indexed in the vector database so the compliance agent can retrieve the most relevant rules for each expense.
            </Bullet>
            <Bullet title="View All Expense Policy Docs">
              Browse all policy documents currently in the system and see which version is active.
            </Bullet>
            <Bullet title="View & Update Prompts">
              Edit the AI prompt used during compliance analysis. Changes take effect immediately for new submissions.
            </Bullet>
          </ul>
        </section>
      </main>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">
        {n}
      </span>
      <div className="flex flex-col gap-1 pt-0.5">
        <span className="text-sm font-semibold text-black dark:text-white">{title}</span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{children}</p>
      </div>
    </li>
  )
}

function Bullet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-black dark:text-white">{title}</span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{children}</p>
      </div>
    </li>
  )
}
