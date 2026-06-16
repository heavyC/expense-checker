import PolicyViewer from './PolicyViewer'

export default function PoliciesPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
          Policy Documents
        </h1>
        <PolicyViewer />
      </main>
    </div>
  )
}
