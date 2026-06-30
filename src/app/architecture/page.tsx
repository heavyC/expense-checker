export default function ArchitecturePage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl mx-auto py-12 px-6 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Architecture
          </h1>
          <p className="text-sm text-zinc-500">
            How the system is structured and how its components interact.
          </p>
        </div>

        {/* Frontend */}
        <Section title="Frontend">
          <p>
            Built with <strong>Next.js</strong> (App Router) and <strong>Tailwind CSS</strong>. Pages are split into a
            server component that fetches data and a <code>Page</code> client component that handles interactivity.
            User identity is managed in a React context (<code>UserContext</code>) backed by <code>localStorage</code> —
            no session tokens or cookies are used.
          </p>
          <p>
            The header renders two navigation rows: one for all users and a second admin-only row that is conditionally
            shown based on the current user&apos;s role.
          </p>
        </Section>

        {/* API layer */}
        <Section title="API Layer">
          <p>
            All mutations and data reads go through Next.js <strong>Route Handlers</strong> under <code>src/app/api/</code>.
            Key routes:
          </p>
          <ul className="flex flex-col gap-2 mt-1">
            <ApiRoute path="PATCH /api/expenses/[id]" description="Updates a single expense field: manager approval, approved-by user, manual approval verdict, final reviewer, or core fields." />
            <ApiRoute path="POST /api/batch-analyze" description="Accepts an array of expense IDs, fetches each from the database, and dispatches them to the Python compliance agent one at a time. Writes the resulting analysis back to expense_analyses." />
            <ApiRoute path="POST /api/analyze-expense" description="Single-expense compliance entrypoint used for ad-hoc analysis. Also handles receipt parsing via a Claude vision call." />
            <ApiRoute path="GET/POST /api/users" description="Looks up a user by login ID or creates a new account." />
            <ApiRoute path="GET/POST /api/policies" description="Lists policy documents or uploads a new one and triggers re-indexing." />
          </ul>
        </Section>

        {/* Database */}
        <Section title="Database">
          <p>
            <strong>PostgreSQL</strong> hosted on <strong>Neon</strong> (serverless). The schema has four main tables:
          </p>
          <ul className="flex flex-col gap-2 mt-1">
            <DbTable name="users" description="Accounts with roles: active, inactive, or admin." />
            <DbTable name="expenses" description="Submitted expense reports. Tracks amounts, category, vendor, manager approval, approved-by user, final reviewer, and manual approval decision." />
            <DbTable name="expense_analyses" description="One analysis row per expense. Stores the AI verdict (APPROVED / FLAGGED / DENIED), reasoning, policy citations, confidence score, and the model used." />
            <DbTable name="prompts" description="Editable prompt templates. Only one row per named prompt may be active at a time." />
          </ul>
          <p className="mt-2 text-sm text-zinc-500">
            The app connects via a tagged-template SQL helper (<code>executeSql</code>) that parameterises all queries.
          </p>
        </Section>

        {/* Compliance agent */}
        <Section title="Compliance Agent">
          <p>
            Written in <strong>Python</strong> (<code>src/scripts/compliance.py</code>). The Next.js API spawns a
            short-lived Python subprocess per expense and reads the JSON result from stdout.<br />
            <b>Update:</b> this has all been transcoded to typescript
          </p>
          <ol className="flex flex-col gap-3 mt-1 list-none">
            <AgentStep n={1} title="RAG retrieval">
              The expense details are used as a query against a <strong>ChromaDB</strong> vector store to retrieve the
              most relevant policy excerpts. Only chunks from the currently active policy version are considered.
            </AgentStep>
            <AgentStep n={2} title="Prompt construction">
              Retrieved excerpts are injected into the active compliance prompt template alongside the expense fields
              (amount, category, vendor, description, client charge flag, manager approval flag).
            </AgentStep>
            <AgentStep n={3} title="Claude analysis">
              The prompt is sent to <strong>Claude</strong> (claude-opus-4-8) with adaptive thinking enabled. The model
              returns a JSON object with verdict, reasoning, policy citations, and a confidence score.
            </AgentStep>
            <AgentStep n={4} title="Result storage">
              The API layer parses the JSON response and writes a row to <code>expense_analyses</code>.
              Flagged expenses surface in the Needs Manual Review queue for admin decision.
            </AgentStep>
          </ol>
        </Section>

        {/* Policy indexing */}
        <Section title="Policy Indexing">
          <p>
            Policy documents are uploaded as plain text, chunked, and embedded into <strong>ChromaDB Cloud</strong>.
            Each chunk is stored with a version number so the compliance agent can target only the current policy
            version during retrieval. Uploading a new document increments the version.
          </p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function ApiRoute({ path, description }: { path: string; description: string }) {
  return (
    <li className="flex gap-3">
      <code className="shrink-0 text-xs bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white px-2 py-0.5 rounded font-mono">
        {path}
      </code>
      <span>{description}</span>
    </li>
  )
}

function DbTable({ name, description }: { name: string; description: string }) {
  return (
    <li className="flex gap-3">
      <code className="shrink-0 text-xs bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white px-2 py-0.5 rounded font-mono">
        {name}
      </code>
      <span>{description}</span>
    </li>
  )
}

function AgentStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-500">
        {n}
      </span>
      <div className="flex flex-col gap-0.5 pt-0.5">
        <span className="text-sm font-semibold text-black dark:text-white">{title}</span>
        <p>{children}</p>
      </div>
    </li>
  )
}
