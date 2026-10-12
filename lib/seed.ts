import { config } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { Index } from '@upstash/vector';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const SIZE = 1800;
const OVERLAP = 250;

type Passage = {
  text: string;
  page: number;
  filename: string;
  version: string;
};

async function main() {
  for (const name of [
    'OPENAI_API_KEY',
    'UPSTASH_VECTOR_REST_URL',
    'UPSTASH_VECTOR_REST_TOKEN',
  ]) {
    if (!process.env[name]) throw new Error(`Missing ${name}`);
  }

  const filenames = (await fs.readdir('data'))
    .filter(name => name.startsWith('LJMB') && name.endsWith('.pdf'))
    .sort();

  if (filenames.length !== 2) {
    throw new Error(`Expected two LJMB PDFs; found ${filenames.length}`);
  }

  const passages: Passage[] = [];

  for (const filename of filenames) {
    const pages = new Map<number, string>();
    const buffer = await fs.readFile(path.join('data', filename));

    await pdfParse(buffer, {
      pagerender: async (page: any) => {
        const content = await page.getTextContent();
        let lastY: number | undefined;
        let text = '';

        for (const item of content.items) {
          const y = item.transform[5];
          text += lastY !== undefined && lastY !== y ? '\n' : ' ';
          text += item.str;
          lastY = y;
        }

        pages.set(page.pageNumber, text.trim());
        return text;
      },
    });

    for (const [page, raw] of [...pages.entries()].sort((a, b) => a[0] - b[0])) {
      const text = raw.replace(/[ \t]+/g, ' ').trim();

      for (let start = 0; start < text.length;) {
        let end = Math.min(start + SIZE, text.length);

        if (end < text.length) {
          const boundary = text.lastIndexOf('\n', end);
          if (boundary > start + SIZE / 2) end = boundary;
        }

        const piece = text.slice(start, end).trim();

        if (piece) {
          passages.push({
            text: piece,
            page,
            filename,
            version: filename.includes('2017') ? '2017' : '2026',
          });
        }

        if (end === text.length) break;
        start = end - OVERLAP;
      }
    }

    console.log(`${filename}: ${pages.size} pages extracted`);
  }

  if (!passages.length) throw new Error('No readable text found.');

  await fs.writeFile(
    'data/extracted-passages.json',
    JSON.stringify(passages, null, 2),
  );

  const index = new Index();
  console.log(`Indexing ${passages.length} passages…`);

  for (let offset = 0; offset < passages.length; offset += 50) {
    const batch = passages.slice(offset, offset + 50);
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: batch.map(p => `${p.filename}\nPage ${p.page}\n${p.text}`),
    });

    await index.upsert(batch.map((p, i) => ({
      id: createHash('sha256')
        .update(`${p.filename}:${p.page}:${p.text}`)
        .digest('hex'),
      vector: embeddings[i],
      metadata: p,
    })));

    console.log(`Stored ${Math.min(offset + 50, passages.length)} passages`);
  }

  console.log('Done: both documents indexed with source metadata.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Indexing failed.');
  process.exit(1);
});
