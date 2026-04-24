import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { opsbrain } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X } from 'lucide-react';

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function readWorkspaceConfig() {
  const raw = localStorage.getItem('opsbrain_workspace_config');
  const parsed = raw ? safeJsonParse(raw) : null;
  return parsed && typeof parsed === 'object' ? parsed : null;
}

async function fetchOverdueCount(workspaceId) {
  if (!workspaceId) return 0;
  const nowIso = new Date().toISOString();
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .neq('status', 'done')
    .lt('due_date', nowIso);
  if (error) return 0;
  return count ?? 0;
}

export default function OpsAgent() {
  const { user, workspaceId, workspaceName } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const bottomRef = useRef(null);

  const workspaceConfig = useMemo(() => (typeof window !== 'undefined' ? readWorkspaceConfig() : null), [open]);
  const activeModules = Array.isArray(workspaceConfig?.modules?.active) ? workspaceConfig.modules.active : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    let mounted = true;
    let timer = null;

    const tick = async () => {
      const count = await fetchOverdueCount(workspaceId);
      if (!mounted) return;
      setAlertCount(count);
    };

    void tick();
    timer = window.setInterval(tick, 60_000);
    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!open) return;
    if (!user || !workspaceId) return;

    let unsub = null;
    let cancelled = false;

    const ensureConversation = async () => {
      try {
        const conv = await opsbrain.agents.createConversation({
          agent_name: 'opsbrain',
          metadata: {
            kind: 'ops_agent',
            workspace_id: workspaceId,
            workspace_name: workspaceName || null,
          },
        });
        if (cancelled) return;
        setConversationId(conv.id);
        setMessages([
          {
            role: 'assistant',
            content: `Hi — I'm OpsAgent. I can summarize activity, find overdue tasks, and create items for "${workspaceName || 'your workspace'}".`,
          },
        ]);
        unsub = opsbrain.agents.subscribeToConversation(conv.id, ({ messages }) => {
          setMessages((prev) => {
            const merged = Array.isArray(messages) && messages.length > 0 ? messages : prev;
            return merged;
          });
        });
      } catch (e) {
        console.error(e);
        toast.error('AI agent is not available right now');
      }
    };

    void ensureConversation();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [open, user, workspaceId, workspaceName]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    // Fast-path “create” commands even if agent backend isn't deployed yet.
    const addTaskMatch = text.match(/^\s*add a task\s*:\s*(.+)$/i);
    if (addTaskMatch?.[1] && workspaceId) {
      try {
        const created = await opsbrain.entities.Task.create({
          workspace_id: workspaceId,
          title: addTaskMatch[1].trim(),
          status: 'todo',
          priority: 'medium',
        });
        setMessages((p) => [
          ...p,
          { role: 'user', content: text },
          { role: 'assistant', content: `Created task: "${created.title}".` },
        ]);
        toast.success('Task created');
        setSending(false);
        return;
      } catch (e) {
        console.error(e);
        toast.error('Failed to create task');
      }
    }

    setMessages((p) => [...p, { role: 'user', content: text }]);

    if (!conversationId) {
      setMessages((p) => [
        ...p,
        {
          role: 'assistant',
          content:
            'Agent backend is not configured yet. If you deploy the optional `agent-reply` function, I can respond with real AI.',
        },
      ]);
      setSending(false);
      return;
    }

    try {
      await opsbrain.agents.addMessage(conversationId, { role: 'user', content: text });
    } catch (e) {
      console.error(e);
      setMessages((p) => [...p, { role: 'assistant', content: 'Failed to send message.' }]);
    } finally {
      setSending(false);
    }
  };

  const badgeVisible = alertCount > 0;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] rounded-2xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors w-14 h-14 flex items-center justify-center"
        aria-label="Open OpsAgent"
      >
        <Bot className="w-6 h-6" />
        {badgeVisible ? (
          <span className="absolute -top-2 -left-2 bg-rose-600 text-white text-xs min-w-6 h-6 px-2 rounded-full flex items-center justify-center border-2 border-white">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        ) : null}
      </button>

      {/* Slide-up panel */}
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-3">
          <div className="w-full sm:max-w-lg">
            <Card className="border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">OpsAgent</div>
                  <div className="text-xs text-slate-500 truncate">
                    {workspaceName ? `Workspace: ${workspaceName}` : 'Workspace'}
                    {activeModules.length ? (
                      <span className="ml-2">
                        <Badge variant="outline">{activeModules.length} modules active</Badge>
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close OpsAgent">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="max-h-[65vh] sm:max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {messages.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={[
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap border',
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-sm'
                          : 'bg-white text-slate-900 border-slate-200 rounded-bl-sm',
                      ].join(' ')}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void send();
                    }}
                    placeholder='Try: "What tasks are overdue?" or "Add a task: follow up with client"'
                    className="bg-white"
                  />
                  <Button onClick={() => void send()} disabled={!input.trim() || sending} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Alerts badge currently tracks overdue tasks. More proactive signals will be added next.
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

