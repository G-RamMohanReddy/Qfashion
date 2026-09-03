/**
 * Q-Stylist — the slide-out styling and discovery agent.
 *
 * The UI half of the pipeline documented in `src/ai/recommender.js`: it collects
 * an utterance, hands it to the parser and ranker, and renders whatever typed
 * blocks come back as real, clickable cards inside the bubble. Card clicks and
 * add-to-bag taps are logged back into the recommender's event table, which is
 * the conversion side of the feedback loop.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, RotateCcw, MapPin } from 'lucide-react';
import { reply, DEFAULT_CHIPS } from '@/ai/stylist.js';
import { logEvent } from '@/ai/recommender.js';
import { getProduct } from '@/lib/catalog.js';
import { HUBS } from '@/data/seedData.js';
import { cx } from '@/lib/format.js';
import { RichText, ProductsBlock, OutfitBlock, OrderBlock, RatingBlock, SizeChartBlock, WeightsNote } from './QStylistBlocks.jsx';
import { useScrollLock } from '@/hooks/useSync.js';

let seq = 0;
const mkId = () => `m${++seq}`;

export default function QStylist({ open, setOpen, hubId, stockOverrides, orders, addFeedback, onAdd, onView, prompt, onConsumePrompt }) {
  const [messages, setMessages] = useState(() => [
    {
      id: mkId(),
      role: 'bot',
      blocks: [
        {
          type: 'text',
          text: "Hi, I'm **Q-Stylist**. I can see what is physically on the shelves near you right now, so anything I show can reach you inside the hour.\n\nAsk me for a look with a budget, a specific piece, your size, or where an order has got to.",
        },
      ],
    },
  ]);
  const [chips, setChips] = useState(DEFAULT_CHIPS);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [nudged, setNudged] = useState(() => {
    try {
      return localStorage.getItem('qfashion.stylist.seen') === '1';
    } catch {
      return false;
    }
  });

  const memory = useRef({ pending: null, draftRating: null, lastOrderId: null, lastLine: null });
  const scroller = useRef(null);
  const input = useRef(null);
  const hubName = HUBS.find((h) => h.id === hubId)?.name;

  useScrollLock(open);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    setNudged(true);
    try {
      localStorage.setItem('qfashion.stylist.seen', '1');
    } catch {
      /* ignore */
    }
    setTimeout(() => input.current?.focus(), 140);
  }, [open]);

  const send = useCallback(
    (raw) => {
      const message = String(raw || '').trim();
      if (!message || busy) return;
      setMessages((m) => [...m, { id: mkId(), role: 'user', blocks: [{ type: 'text', text: message }] }]);
      setBusy(true);

      // a short beat reads as thinking rather than as a lookup table
      setTimeout(() => {
        const res = reply(message, { hubId, stockOverrides, ...memory.current }, { orders, addFeedback });
        memory.current = { ...memory.current, ...res.patch };
        setChips(res.chips);
        setMessages((m) => [...m, { id: mkId(), role: 'bot', ...res }]);
        setBusy(false);
      }, 400);
    },
    [busy, hubId, stockOverrides, orders, addFeedback]
  );

  useEffect(() => {
    if (!prompt) return undefined;
    setOpen(true);
    const t = setTimeout(() => {
      send(prompt);
      onConsumePrompt?.();
    }, 260);
    return () => clearTimeout(t);
  }, [prompt, send, setOpen, onConsumePrompt]);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [setOpen]);

  const resolve = (mini) => getProduct(mini.id, hubId, stockOverrides);

  const addFromChat = (mini) => {
    const full = resolve(mini);
    if (!full) return;
    logEvent('add_to_bag', { productId: mini.id });
    onAdd(full, full.sizes[Math.min(2, full.sizes.length - 1)]);
  };
  const addAll = (items) => items.forEach(addFromChat);
  const view = (mini) => {
    const full = resolve(mini);
    if (!full) return;
    logEvent('click', { productId: mini.id });
    setOpen(false);
    onView(full);
  };

  const renderBlock = (b, i) => {
    if (b.type === 'products') return <ProductsBlock key={i} block={b} onAdd={addFromChat} onView={view} />;
    if (b.type === 'outfit') return <OutfitBlock key={i} block={b} onAdd={addFromChat} onView={view} onAddAll={addAll} />;
    if (b.type === 'order') return <OrderBlock key={i} order={b.order} />;
    if (b.type === 'rating') return <RatingBlock key={i} onRate={(n) => send(`${n} stars`)} />;
    if (b.type === 'sizeChart') return <SizeChartBlock key={i} block={b} />;
    return null;
  };

  return (
    <>
      {!open && (
        <div className="fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-2 sm:right-6">
          {!nudged && (
            <div className="relative max-w-[15rem] animate-rise rounded-lg border border-line bg-surface shadow-lift">
              <button onClick={() => setOpen(true)} className="block px-3 py-2 pr-7 text-left text-xs">
                <span className="font-extrabold">Need outfit ideas?</span>
                <span className="mt-0.5 block text-muted">Q-Stylist can see what is in stock near you right now.</span>
              </button>
              <button onClick={() => setNudged(true)} aria-label="Dismiss" className="absolute right-1 top-1 rounded p-1 text-muted hover:text-ink">
                <X size={12} />
              </button>
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open Q-Stylist"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lift transition-transform hover:scale-105"
          >
            <Sparkles size={22} strokeWidth={2.2} />
            {!nudged && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-speed" />}
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end sm:inset-auto sm:bottom-5 sm:right-6">
          <div className="flex h-full w-full flex-col overflow-hidden bg-canvas shadow-pop sm:h-[min(38rem,84vh)] sm:w-[26rem] sm:rounded-xl sm:border sm:border-line">
            <header className="flex items-center gap-2.5 border-b border-line bg-surface px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary"><Sparkles size={17} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-tight">Q-Stylist</p>
                <p className="flex items-center gap-1 text-2xs text-muted"><MapPin size={9} /> live stock near {hubName}</p>
              </div>
              <button
                onClick={() => {
                  memory.current = { pending: null, draftRating: null, lastOrderId: null, lastLine: null };
                  setChips(DEFAULT_CHIPS);
                  setMessages((m) => m.slice(0, 1));
                }}
                title="Clear conversation"
                className="rounded p-1.5 text-muted hover:text-ink"
              >
                <RotateCcw size={14} />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close Q-Stylist" className="rounded p-1.5 text-muted hover:text-ink">
                <X size={16} />
              </button>
            </header>

            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={cx('flex animate-rise', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cx('space-y-2', m.role === 'user' ? 'max-w-[85%]' : 'w-full')}>
                    {m.blocks.map((b, i) =>
                      b.type === 'text' ? (
                        <div key={i} className={cx('rounded-lg px-3 py-2', m.role === 'user' ? 'bg-primary text-white' : 'border border-line bg-surface')}>
                          <RichText text={b.text} />
                        </div>
                      ) : (
                        renderBlock(b, i)
                      )
                    )}
                    {m.role === 'bot' && m.blocks.some((b) => b.type === 'products' || b.type === 'outfit') && <WeightsNote weights={m.weights} />}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex w-fit items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-blink rounded-full bg-muted" style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto border-t border-line bg-surface px-3 py-2">
                {chips.map((c) => (
                  <button key={c} onClick={() => send(c)} className="chip shrink-0 whitespace-nowrap px-3 py-1.5 text-2xs">{c}</button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
                setDraft('');
              }}
              className="flex items-center gap-2 border-t border-line bg-surface p-2.5"
            >
              <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask for a look, a size, or an order…" aria-label="Message Q-Stylist" className="field" />
              <button type="submit" disabled={!draft.trim() || busy} className="btn-primary shrink-0 px-3 py-2.5" aria-label="Send">
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
