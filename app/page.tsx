'use client';

import { useChat } from '@ai-sdk/react';

type Source = { text?: string; page?: number; score?: number; filename?: string; version?: string };

export default function Page() {
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/chat',
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">LJMB Course Finder</h1>
        <p className="text-sm text-slate-500">
          Find LJMB courses for your team's learning needs. Sources appear under each answer.
        </p>
      </header>

      <ul className="space-y-4 mb-6 min-h-[200px]">
        {messages.length === 0 && (
          <li className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">
              What does your team need to learn?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Describe a learning need or choose an example below.
              Recommendations use the supplied LJMB documents.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Which course helps managers delegate effectively?',
                'Which course teaches PESOS coaching?',
                'What course would help a first-time manager?',
              ].map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setInput(question)}
                  className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-left text-sm text-slate-800 hover:bg-cyan-100"
                >
                  {question}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Choose a question, then press Send. Check the sources and
              confirm current course availability and pricing with LJMB.
            </p>
          </li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'flex justify-end'
                : 'flex justify-start flex-col items-start'
            }
          >
            <span
              className={
                m.role === 'user'
                  ? 'inline-block rounded-2xl bg-cyan-600 text-white px-4 py-2 max-w-[85%] whitespace-pre-wrap leading-relaxed'
                  : 'inline-block rounded-2xl bg-white border border-slate-200 px-4 py-2 max-w-[85%] whitespace-pre-wrap leading-relaxed'
              }
            >
              {m.content}
            </span>

            {m.role === 'assistant' &&
              m.toolInvocations?.map(
                (inv) =>
                  inv.state === 'result' &&
                  inv.toolName === 'getInformation' && (
                    <details
                      key={inv.toolCallId}
                      className="mt-2 text-sm text-slate-600 max-w-[85%]"
                    >
                      <summary className="cursor-pointer">
                        Sources ({(inv.result as Source[]).length})
                      </summary>
                      <p className="mt-2 text-xs text-slate-500">
                        Retrieved passages for checking the answer.
                        Similarity scores do not measure answer confidence.
                      </p>
                      {(inv.result as Source[]).length === 0 && (
                        <p className="mt-2">
                          No readable passages were returned for this search.
                        </p>
                      )}
                      <ul className="mt-2 space-y-2">
                        {(inv.result as Source[]).map((src, i) => (
                          <li
                            key={i}
                            className="border-l-2 border-cyan-500 pl-3"
                          >
                            <span className="text-xs text-slate-400">
                              {src.filename ?? 'LJMB document'} · page {src.page ?? '?'} · score{' '}
                              {typeof src.score === 'number'
                                ? src.score.toFixed(2)
                                : '—'}
                            </span>
                            {(src.version === '2017' ||
                              src.filename?.includes('2017')) && (
                              <p className="my-1 font-medium text-amber-800">
                                Historical 2017 curriculum. Confirm current
                                course details and availability with LJMB.
                              </p>
                            )}
                            <p>{src.text}</p>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ),
              )}
          </li>
        ))}
        {status === 'streaming' && (
          <li className="text-sm text-slate-400">…</li>
        )}
        {error && (
          <li className="text-sm text-rose-600">
            Error: {error.message}
          </li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          placeholder="Ask about leadership, delegation, coaching, and more…"
          disabled={status === 'streaming' || status === 'submitted'}
        />
        <button
          type="submit"
          disabled={!input || status === 'streaming' || status === 'submitted'}
          className="rounded-lg bg-slate-900 text-white px-4 py-2 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </main>
  );
}
