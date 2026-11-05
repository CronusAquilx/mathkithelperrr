export type PlaybackState = 'pending' | 'ready' | 'error';

/** A loaded embed document is not proof that its video loaded. */
export function playbackState(media: { readyState: number; currentTime: number; error: unknown }[], errorText: string): PlaybackState {
  if (media.some(video => !video.error && (video.readyState >= 2 || video.currentTime > 0))) return 'ready';
  if (media.some(video => Boolean(video.error))) return 'error';
  if (/internal service worker error|astra relay error|episode (?:not found|unavailable)|no available servers found|(?:video|media|source|stream) (?:is )?(?:not found|unavailable)|no (?:sources|streams) (?:found|available)|failed to (?:load|fetch) (?:video|media|source|stream)|error loading (?:video|media)|file cannot be played/i.test(errorText)) return 'error';
  return 'pending';
}

/** Read the proxy's accessible player frames; inaccessible frames remain pending. */
export function readPlaybackState(root: Window | null): PlaybackState {
  return readPlaybackDetails(root).state;
}

/** Same as readPlaybackState, plus how many media elements were found. */
export function readPlaybackDetails(root: Window | null): { state: PlaybackState; mediaCount: number } {
  const media: { readyState: number; currentTime: number; error: unknown }[] = [];
  const errors: string[] = [];
  const visit = (win: Window | null, depth: number) => {
    if (!win || depth > 5) return;
    try {
      const doc = win.document;
      for (const video of Array.from(doc.querySelectorAll<HTMLMediaElement>('video, audio'))) {
        media.push({ readyState: video.readyState, currentTime: video.currentTime, error: video.error });
      }
      for (const node of Array.from(doc.querySelectorAll('[role="alert"], .jw-error-text, .vjs-error-display, .error-message'))) errors.push(node.textContent ?? '');
      const text = doc.body?.innerText ?? '';
      // Provider/worker error screens are short; don't scan episode descriptions.
      if (text.length < 1500) errors.push(text);
      for (const frame of Array.from(doc.querySelectorAll('iframe'))) visit(frame.contentWindow, depth + 1);
    } catch { /* Cross-origin provider frames cannot be inspected. */ }
  };
  visit(root, 0);
  return { state: playbackState(media, errors.join('\n')), mediaCount: media.length };
}