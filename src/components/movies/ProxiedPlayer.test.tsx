import { render, cleanup, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProxiedPlayer } from './ProxiedPlayer';
import { VOICE_SEARCH_WAIT_MS } from '@/lib/movies/voice-search';

const mocks = vi.hoisted(() => ({ tracks: [] as { id: string; label: string; language: string; active: boolean; select: () => void }[] }));
vi.mock('@/lib/astra/prefs', () => ({ usePrefs: () => ({ transport: 'test', wisp: 'test' }) }));
vi.mock('@/lib/astra/proxy', () => ({ openProxied: () => Promise.resolve() }));
vi.mock('@/lib/astra/proxy-popups', () => ({ attachProxiedPopups: () => () => {} }));
vi.mock('@/lib/movies/audio-tracks', () => ({ discoverVoiceTracks: () => mocks.tracks, voiceLabel: (_language: string, label: string) => label }));
afterEach(() => { cleanup(); vi.useRealTimers(); mocks.tracks = []; });

describe('preferred spoken language playback', () => {
  it('selects English and confirms it before stopping search', () => {
    vi.useFakeTimers();
    const result = vi.fn();
    const track = { id: 'en', label: 'English', language: 'en', active: false, select: vi.fn(() => { track.active = true; }) };
    mocks.tracks = [track];
    render(<ProxiedPlayer src="https://example.com/movie/1" title="Movie" voice="en" onVoiceResult={result} />);
    expect(track.select).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledWith(true);
    act(() => vi.advanceTimersByTime(VOICE_SEARCH_WAIT_MS));
    expect(result).toHaveBeenCalledTimes(1);
  });
  it('requests the next source once when English cannot be verified', () => {
    vi.useFakeTimers();
    const result = vi.fn();
    render(<ProxiedPlayer src="https://example.com/movie/1" title="Movie" voice="en" onVoiceResult={result} />);
    act(() => vi.advanceTimersByTime(VOICE_SEARCH_WAIT_MS - 1));
    expect(result).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(result).toHaveBeenCalledWith(false);
    act(() => vi.advanceTimersByTime(VOICE_SEARCH_WAIT_MS));
    expect(result).toHaveBeenCalledTimes(1);
  });
  it('restarts an exhausted search on the same source when Retry is requested', () => {
    vi.useFakeTimers();
    const result = vi.fn();
    const { rerender } = render(<ProxiedPlayer src="https://example.com/movie/1" title="Movie" voice="en" searchAttempt={0} onVoiceResult={result} />);
    act(() => vi.advanceTimersByTime(VOICE_SEARCH_WAIT_MS));
    expect(result).toHaveBeenCalledTimes(1);
    rerender(<ProxiedPlayer src="https://example.com/movie/1" title="Movie" voice="en" searchAttempt={1} onVoiceResult={result} />);
    act(() => vi.advanceTimersByTime(VOICE_SEARCH_WAIT_MS));
    expect(result).toHaveBeenCalledTimes(2);
  });
  it('does not automatically abandon a manually selected source', () => {
    vi.useFakeTimers();
    const result = vi.fn();
    render(<ProxiedPlayer src="https://example.com/movie/1" title="Movie" voice="en" autoVoiceSearch={false} onVoiceResult={result} />);
    act(() => vi.advanceTimersByTime(VOICE_SEARCH_WAIT_MS * 2));
    expect(result).not.toHaveBeenCalled();
  });
});