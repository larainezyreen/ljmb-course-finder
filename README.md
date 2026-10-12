# LJMB Course Finder

A document-grounded chat app that helps managers and L&D professionals find relevant LJMB courses.

Created for Week 14 Mini-Project 14.3: Ship Your Own RAG, adapting the course-provided Next.js starter.

## Live app

https://ljmb-course-finder.vercel.app

## Features

- Streaming responses using the Vercel AI SDK.
- Retrieval through the getInformation tool.
- Semantic search with OpenAI embeddings and Upstash Vector.
- Expandable sources with filenames, page numbers, similarity scores, and passage text.
- Two-PDF ingestion with source metadata.
- Instructions to acknowledge missing information rather than invent details.

Similarity scores measure retrieval similarity, not answer confidence.

## Technology

Next.js, TypeScript, Vercel AI SDK, OpenAI GPT-4.1 mini, text-embedding-3-small, Upstash Vector, and Vercel hosting.

## Corpus

1. LJMB - 22-Course Curriculum - Leadership & Management Development Program v2017.pdf: 25 pages.
2. LJMB Company Profile Catalogue 2026 VERSION .pdf: 12 pages.

The documents cover courses, learning objectives, frameworks, and company information. The 2017 curriculum is historical material and does not confirm current availability.

The PDFs are not included in this repository. Obtain authorized copies from the project owner to reproduce the index.

## Local setup

### Install dependencies

    npm ci

### Configure credentials

    cp .env.example .env.local

Fill in these three variables in .env.local:

    OPENAI_API_KEY=
    UPSTASH_VECTOR_REST_URL=
    UPSTASH_VECTOR_REST_TOKEN=

Use an OpenAI project with access to the required models and an Upstash Vector index whose dimensions match the embedding model.

Keep credentials server-side. Do not use NEXT_PUBLIC_ prefixes or commit real credentials.

### Add the documents

    mkdir -p data

Place both original PDFs in data/. The seed script requires exactly two filenames beginning with LJMB and ending with .pdf.

### Index the corpus

    npm run seed

Text is extracted page by page and split into chunks of up to 1,800 characters with 250-character overlap, preferring line boundaries where possible.

Passages are embedded and stored with text, filename, page, and version metadata. The original corpus produced 61 passages.

Identical passages use identical hash-based IDs. Changed or removed passages are not automatically deleted. Use a fresh dedicated index when rebuilding a changed corpus.

### Run locally

    npm run dev

Open http://localhost:3000.

### Check the production build

    npm run build

## Retrieval design

The model can call getInformation when document information is needed. The tool embeds the query and retrieves eight candidate passages from Upstash. It removes empty passages, exact duplicates, and shorter passages fully contained in another passage from the same document page, then returns up to four sources. Partial overlaps and less relevant passages can still remain.

The model uses the retrieved passages to answer, and the interface displays the retrieved sources beneath the response.

Documents are retrieved through a tool call rather than automatically attached to every message.

## Example questions

- Which course helps managers delegate effectively?
- Which course teaches PESOS coaching?
- Which course uses GROW coaching?
- What course would help a first-time manager?
- Do the supplied documents include Python programming courses?
- Do the documents specify course prices?

## Deployment

Import the repository into Vercel.

Configure OPENAI_API_KEY, UPSTASH_VECTOR_REST_URL, and UPSTASH_VECTOR_REST_TOKEN for Production, without surrounding quotation marks. Then deploy or redeploy.

Run the seed script before testing. Production queries the configured Upstash index; deployment does not automatically index the PDFs.

## Validation

Manual examples retrieved relevant delegation, PESOS, and GROW course information. Missing-information questions were also exercised.

The GitHub repository was verified as accessible in an incognito browser window.

This is a small manual sample, not a comprehensive accuracy evaluation.

## Limitations

- Search can return overlapping or less relevant passages.
- PDF text extraction can preserve awkward spacing.
- Image-only PDFs require OCR, which is not implemented.
- Retrieved sources do not guarantee every generated statement is correct.
- Historical and newer documents are mixed.
- Current pricing and availability require confirmation with LJMB.
- Application-level authentication and rate limiting are not implemented.

## Main files

- app/page.tsx: chat interface and sources.
- app/api/chat/route.ts: streaming responses and retrieval tool.
- lib/seed.ts: extraction, chunking, embedding, and indexing.

## Author

Laraine Zyreen R. Marcelo


## Historical sources and factual follow-ups

Sources from the 2017 curriculum display a historical-material label.
Users should confirm current course details, pricing, and availability with LJMB.

Recognized factual follow-ups, such as "How long is that course?" and
"How much does it cost?", require a getInformation tool call when earlier
retrieval exists in the conversation. The model uses conversation context
to formulate the search. The answer then streams, and the actual retrieved
passages appear beneath it.

This routing uses a limited set of follow-up keywords and references.
It does not cover every possible follow-up phrasing.
Other requests retain the model's normal tool selection.

Production retests demonstrated separate sources beneath the GROW duration
and pricing follow-ups. The duration matched the historical curriculum;
the pricing answer acknowledged missing information.

## Chunking trade-off

Page-based extraction preserves precise page attribution. The 1,800-character
chunks and 250-character overlap retain some context across chunk boundaries.
However, course descriptions may span chunks, and overlap can produce
repeated content. A future improvement is to chunk by course sections
while preserving page metadata.
