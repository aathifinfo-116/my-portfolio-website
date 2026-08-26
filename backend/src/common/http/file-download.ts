import { HttpStatus, StreamableFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';

/**
 * RFC 6266 Content-Disposition.
 *
 * Percent-encoding the plain `filename=` value makes browsers save the file
 * with literal %20 in its name. The correct form pairs an ASCII-sanitised
 * fallback with a `filename*` field carrying the real UTF-8 name.
 */
export function contentDisposition(fileName: string): string {
  const asciiFallback = fileName
    // Non-printable-ASCII, quotes and backslashes would break the header.
    .replace(/[^ -~]/g, '_')
    .replace(/["\\]/g, '_');

  return [
    'attachment',
    `filename="${asciiFallback}"`,
    `filename*=UTF-8''${encodeURIComponent(fileName)}`,
  ].join('; ');
}

/**
 * Parses a single-range `Range: bytes=start-end` header.
 *
 * Returns null when there is no usable range (send the whole file),
 * 'unsatisfiable' when the range falls outside the file (416), or the
 * resolved inclusive byte bounds. Multi-range requests are deliberately
 * treated as no-range: serving the whole file is a valid response and avoids
 * multipart/byteranges.
 */
export function parseRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | 'unsatisfiable' | null {
  if (!header || size === 0) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;

  // "bytes=-500" means the final 500 bytes.
  if (rawStart === '') {
    if (rawEnd === '') return null;
    const suffix = parseInt(rawEnd, 10);
    if (suffix <= 0) return 'unsatisfiable';
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }

  const start = parseInt(rawStart, 10);
  const end = rawEnd === '' ? size - 1 : Math.min(parseInt(rawEnd, 10), size - 1);

  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}

/**
 * Streams a file as an attachment, honouring Range requests.
 *
 * Shared by every download endpoint so headers cannot drift between them:
 * an explicit Content-Type, an RFC 6266 filename, Accept-Ranges, and a
 * Content-Length taken from the real file size rather than a stored column.
 */
export function streamFileDownload(
  req: Request,
  res: Response,
  options: {
    absolutePath: string;
    fileName: string;
    mimeType?: string | null;
    size: number;
  },
): StreamableFile {
  const { absolutePath, fileName, mimeType, size } = options;

  res.set({
    'Content-Type': mimeType ?? 'application/octet-stream',
    'Content-Disposition': contentDisposition(fileName),
    // Chrome's embedded PDF viewer will not download without this.
    'Accept-Ranges': 'bytes',
    // Downloads should not be served from a stale cache after a re-upload.
    'Cache-Control': 'no-cache',
  });

  const range = parseRange(req.headers.range, size);

  if (range === 'unsatisfiable') {
    res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
    res.set({ 'Content-Range': `bytes */${size}` });
    return new StreamableFile(Buffer.alloc(0));
  }

  let stream: ReturnType<typeof createReadStream>;

  if (range) {
    res.status(HttpStatus.PARTIAL_CONTENT);
    res.set({
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      'Content-Length': String(range.end - range.start + 1),
    });
    stream = createReadStream(absolutePath, {
      start: range.start,
      end: range.end,
    });
  } else {
    res.set({ 'Content-Length': String(size) });
    stream = createReadStream(absolutePath);
  }

  // If the file vanishes between the existence check and the read, destroy
  // the response rather than letting an unhandled 'error' kill the process.
  stream.on('error', () => res.destroy());

  return new StreamableFile(stream);
}
