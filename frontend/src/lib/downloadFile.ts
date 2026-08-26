import { apiClient, extractErrorMessage } from './apiClient';

/**
 * Downloads a file by fetching it into a Blob and clicking a synthetic anchor.
 *
 * A plain `<a href download>` is unreliable for PDFs specifically: the
 * `download` attribute is ignored cross-origin, and browsers with a built-in
 * PDF viewer may hand the response to that viewer instead of saving it — the
 * failure surfaces as "File wasn't available on site". Formats the browser
 * cannot render (docx, pptx) are unaffected, which is why only PDFs broke.
 *
 * Fetching to a Blob sidesteps both behaviours: the bytes are already in
 * memory and the object URL is same-origin by construction, so the download
 * attribute is always honoured.
 */
/**
 * @param url Origin-relative path, e.g. "/api/documents/{id}/download" or
 *            "/static/resume/cv.pdf". Callers resolve their own URLs so this
 *            helper never has to guess which prefix applies.
 */
export async function downloadFile(
  url: string,
  fileName: string,
): Promise<void> {
  // Axios rather than fetch so the auth interceptor applies and failures
  // surface through the same error formatting as every other request.
  // baseURL is cleared: `url` is already complete.
  const response = await apiClient.get<Blob>(url, {
    responseType: 'blob',
    baseURL: '',
  });

  const blobUrl = window.URL.createObjectURL(response.data);

  try {
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    // Firefox requires the anchor to be in the document for the click to fire.
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoking synchronously can cancel the download in some browsers; a
    // macrotask later is safely after the click has been processed.
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  }
}

/** Wraps downloadFile with the toast-friendly error message. */
export async function downloadFileWithFeedback(
  url: string,
  fileName: string,
  onError: (message: string) => void,
): Promise<void> {
  try {
    await downloadFile(url, fileName);
  } catch (error) {
    onError(extractErrorMessage(error, 'The file could not be downloaded.'));
  }
}
