'use client';
import { useEffect, useRef, useState } from 'react';
import type { LibvioViewState } from '@/lib/libvio';

/** A sandboxed native site view, preserving the website's real origin/session. */
export function LibvioPlayer(props: {
  url: string;
  getRestorePosition: () => number | Promise<number>;
  onProgress: (time: number, duration: number) => void;
  onEnded: () => void;
  onQuality: (height: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const call = window.haruDesktop?.libvioView;
    if (!call) {
      setError('LIBVIO 网页播放器需要使用 haruTV 桌面客户端');
      return;
    }
    let cancelled = false,
      polling = false,
      ended = false,
      restored = false,
      height = 0,
      raf = 0;
    let state: LibvioViewState | null = null;
    const bounds = () => {
      const rect = frame.current?.getBoundingClientRect();
      if (!rect) return undefined;
      const obscured = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        visible: !obscured && rect.y >= 65 && rect.bottom > 65 && rect.y < innerHeight,
      };
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!cancelled) void call({ action: 'bounds', bounds: bounds() });
      });
    };
    const tick = async () => {
      if (cancelled || polling) return;
      polling = true;
      try {
        state = await call({ action: 'state' });
        if (cancelled) return;
        if (state.error) {
          setError(state.error);
          return;
        }
        if (state.height && state.height !== height) {
          height = state.height;
          latest.current.onQuality(height);
        }
        if (state.duration && state.duration > 0) {
          if (!restored) {
            restored = true;
            const saved = await latest.current.getRestorePosition();
            if (saved > 10 && saved < state.duration - 2)
              await call({ action: 'seek', time: saved });
          }
          latest.current.onProgress(state.time || 0, state.duration);
          if (state.ended && !ended) {
            ended = true;
            latest.current.onEnded();
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'LIBVIO 播放器暂不可用');
      } finally {
        polling = false;
      }
    };
    setError('');
    void call({ action: 'attach', url: props.url, bounds: bounds() })
      .then((result) => {
        if (result.error && !cancelled) setError(result.error);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    const interval = setInterval(() => void tick(), 1500);
    const resize = new ResizeObserver(sync);
    if (frame.current) resize.observe(frame.current);
    const mutation = new MutationObserver(sync);
    mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal'],
    });
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    return () => {
      cancelled = true;
      clearInterval(interval);
      cancelAnimationFrame(raf);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
      if (state?.duration) latest.current.onProgress(state.time || 0, state.duration);
      void call({ action: 'close' });
    };
  }, [props.url, attempt]);
  return (
    <div ref={frame} className="w-full h-full bg-black text-white flex items-center justify-center">
      <div className="text-center text-sm space-y-3">
        <p>{error || '正在打开 LIBVIO 网页播放器…'}</p>
        {error && (
          <button className="btn-ghost btn-sm" onClick={() => setAttempt((a) => a + 1)}>
            重试播放器
          </button>
        )}
      </div>
    </div>
  );
}
