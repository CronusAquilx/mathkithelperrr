import { describe, expect, it } from 'vitest';
import { playbackState } from './playback-state';

describe('episode playback readiness', () => {
  it('does not count an embed document as a loaded episode', () => {
    expect(playbackState([], '')).toBe('pending');
    expect(playbackState([{ readyState: 1, currentTime: 0, error: null }], '')).toBe('pending');
  });
  it('retries explicit provider and proxy failures', () => {
    expect(playbackState([], 'Episode not found')).toBe('error');
    expect(playbackState([], 'Internal Service Worker Error: Error: Astra relay error 401: Unauthorized')).toBe('error');
    expect(playbackState([{ readyState: 0, currentTime: 0, error: { code: 4 } }], '')).toBe('error');
  });
  it('keeps a loaded or advancing episode instead of switching sources', () => {
    expect(playbackState([{ readyState: 2, currentTime: 0, error: null }], '')).toBe('ready');
    expect(playbackState([{ readyState: 1, currentTime: 20, error: null }], '')).toBe('ready');
  });
  it('does not reject a working nested video because a sibling failed', () => {
    expect(playbackState([{ readyState: 2, currentTime: 0, error: null }], 'Video unavailable')).toBe('ready');
  });
});
describe('provider failure screens', () => {
  it('treats "No available servers" and 404 pages as errors so the next server is tried', () => {
    expect(playbackState([], 'Playback Error\nNo available servers found.')).toBe('error');
    expect(playbackState([], '404\nThis page could not be found.')).toBe('error');
  });
});
