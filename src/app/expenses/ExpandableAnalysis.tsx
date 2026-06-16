'use client'

import { useState } from 'react'

interface Props {
  reasoning: string | null
  policyCitations: string[] | null
  policyExcerpts: string[] | null
  verdictBadge: string
  verdictLabel: string
  confidencePct: number | null
  analyzedAt: string | null
}

export default function ExpandableAnalysis({
  reasoning,
  policyCitations,
  policyExcerpts,
  verdictBadge,
  verdictLabel,
  confidencePct,
  analyzedAt,
}: Props) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const [citationsExpanded, setCitationsExpanded] = useState(false)

  const firstCitation = policyCitations?.[0] ?? null
  const citationsHasMore = policyCitations && policyCitations.length > 1

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${verdictBadge}`}>
          {verdictLabel}
        </span>
        {confidencePct !== null && (
          <span className="text-xs text-zinc-400">{confidencePct}% confidence</span>
        )}
        {analyzedAt && (
          <span className="text-xs text-zinc-400 ml-auto">
            Analyzed {new Date(analyzedAt).toLocaleString()}
          </span>
        )}
      </div>

      {reasoning && (
        <div className="flex flex-col gap-1">
          <p className={`text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed ${reasoningExpanded ? '' : 'line-clamp-1'}`}>
            {reasoning}
          </p>
          <button
            onClick={() => setReasoningExpanded((e) => !e)}
            className="self-start text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            {reasoningExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}

      {firstCitation && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Policy Citations</p>
          <ul className="flex flex-col gap-1">
            <li className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              {firstCitation}
            </li>
            {citationsExpanded &&
              policyCitations!.slice(1).map((citation, index) => (
                <li key={index + 1} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  {citation}
                </li>
              ))}
          </ul>
          {citationsHasMore && (
            <button
              onClick={() => setCitationsExpanded((e) => !e)}
              className="mt-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              {citationsExpanded
                ? 'Show less'
                : `Show ${policyCitations!.length - 1} more`}
            </button>
          )}
        </div>
      )}

      {policyExcerpts && policyExcerpts.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-zinc-400 select-none">
            Policy excerpts used ({policyExcerpts.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
            {policyExcerpts.map((excerpt, index) => (
              <li key={index} className="text-zinc-500 leading-relaxed">{excerpt}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
