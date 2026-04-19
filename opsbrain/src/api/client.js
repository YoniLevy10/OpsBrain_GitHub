import { supabase } from '@/lib/supabase';

/** Maps PascalCase entity names to Postgres table names (jsonb `data` + common columns). */
const ENTITY_TABLE = {
  Report: 'reports',
  Project: 'projects',
  Client: 'clients',
  Task: 'tasks',
  UserWorkspaceState: 'user_workspace_states',
  Workspace: 'workspaces',
  Professional: 'professionals',
  Invoice: 'invoices',
  Business: 'businesses',
  Integration: 'integrations',
  SyncLog: 'sync_logs',
  DashboardWidget: 'dashboard_widgets',
  WorkspaceMember: 'workspace_members',
  Permission: 'permissions',
  Forecast: 'forecasts',
  Transaction: 'transactions',
  Subscription: 'subscriptions',
  Payment: 'payments',
  Review: 'reviews',
  ProfessionalChat: 'professional_chats',
  ChatMessage: 'chat_messages',
  TimeEntry: 'time_entries',
  Budget: 'budgets',
  Document: 'documents',
  WorkspaceIntegration: 'workspace_integrations',
  DashboardConfig: 'dashboard_configs',
  Notification: 'notifications',
  ActivityFeed: 'activity_feeds',
  Comment: 'comments',
  Interaction: 'interactions',
  Automation: 'automations',
  DocumentTemplate: 'document_templates',
  Analytics: 'analytics',
  MLInsight: 'ml_insights',
  AIInsight: 'ai_insights',
};

/** Typed columns per table (rest stays in jsonb `data`). See Developer Reference schema. */
const COLUMN_FIELDS = {
  workspaces: ['name', 'owner_id', 'slug', 'plan', 'settings'],
  tasks: ['title', 'status', 'priority', 'assigned_to', 'due_date', 'module_ref', 'module_ref_id'],
  workspace_members: ['user_id', 'role', 'joined_at'],
  ai_insights: ['type', 'content', 'source_module', 'severity', 'is_read'],
};

function flattenRow(table, row) {
  if (!row) return null;
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  const created = row.created_at ?? row.created_date;
  const out = {
    ...data,
    id: row.id,
    created_at: created,
    created_date: created,
    updated_at: row.updated_at,
  };
  if (row.workspace_id !== undefined && row.workspace_id !== null) {
    out.workspace_id = row.workspace_id;
  }
  const cols = COLUMN_FIELDS[table];
  if (cols) {
    for (const k of cols) {
      if (row[k] !== undefined && row[k] !== null) out[k] = row[k];
    }
  }
  return out;
}

function splitPayload(table, payload) {
  const cols = COLUMN_FIELDS[table];
  const { id, workspace_id, created_at, updated_at, created_date, data: nestedData, ...rest } = payload;
  const base = { id, workspace_id: workspace_id ?? null };
  if (!cols) {
    return { ...base, data: rest };
  }
  const row = { ...base };
  const data = {};
  for (const [k, v] of Object.entries(rest)) {
    if (cols.includes(k)) {
      row[k] = v;
    } else {
      data[k] = v;
    }
  }
  row.data =
    Object.keys(data).length > 0
      ? data
      : nestedData && typeof nestedData === 'object'
        ? nestedData
        : {};
  return row;
}

function tableEqCols(table) {
  const s = new Set(['id', 'workspace_id']);
  const extra = COLUMN_FIELDS[table];
  if (extra) extra.forEach((c) => s.add(c));
  return s;
}

function parseFilterArgs(sortArg, limitArg) {
  let sort = '-created_at';
  let limit;
  if (typeof sortArg === 'number') {
    limit = sortArg;
  } else if (sortArg) {
    sort = sortArg;
    if (typeof limitArg === 'number') limit = limitArg;
  }
  return { sort, limit };
}

function parseListArgs(a, b) {
  return parseFilterArgs(a, b);
}

function applyFilters(query, filters, table) {
  const eqSet = tableEqCols(table);
  let q = query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (eqSet.has(key)) {
      q = q.eq(key, value);
    } else {
      const v =
        typeof value === 'boolean' ? String(value) : value === null ? 'null' : String(value);
      q = q.filter(`data->>${key}`, 'eq', v);
    }
  }
  return q;
}

function applySort(q, sort) {
  if (!sort) return q.order('created_at', { ascending: false });
  const desc = sort.startsWith('-');
  const raw = desc ? sort.slice(1) : sort;
  const col = raw === 'created_date' || raw === 'date' ? 'created_at' : raw;
  return q.order(col, { ascending: !desc });
}

function createEntityApi(table) {
  const rootTable = table === 'workspaces';

  return {
    async filter(filters = {}, sortArg, limitArg) {
      const { sort, limit } = parseFilterArgs(sortArg, limitArg);
      let query = supabase.from(table).select('*');
      query = applyFilters(query, filters, table);
      query = applySort(query, sort);
      if (limit != null) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r) => flattenRow(table, r));
    },

    async list(a, b) {
      const { sort, limit } = parseListArgs(a, b);
      let query = supabase.from(table).select('*');
      query = applySort(query, sort);
      if (limit != null) query = query.limit(limit);
      else query = query.limit(500);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r) => flattenRow(table, r));
    },

    async create(payload) {
      const row = splitPayload(table, payload);
      if (rootTable) delete row.workspace_id;
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw error;
      return flattenRow(table, data);
    },

    async bulkCreate(rows) {
      const insertRows = rows.map((r) => {
        const row = splitPayload(table, r);
        if (rootTable) delete row.workspace_id;
        return row;
      });
      const { data, error } = await supabase.from(table).insert(insertRows).select();
      if (error) throw error;
      return (data || []).map((r) => flattenRow(table, r));
    },

    async update(id, patch) {
      const { data: existing, error: fetchErr } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!existing) throw new Error(`Row not found: ${id}`);
      const flat = flattenRow(table, existing);
      const merged = { ...flat, ...patch };
      const row = splitPayload(table, merged);
      row.updated_at = new Date().toISOString();
      if (rootTable) delete row.workspace_id;
      const { data, error } = await supabase.from(table).update(row).eq('id', id).select().single();
      if (error) throw error;
      return flattenRow(table, data);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

const entities = {};
for (const [name, tbl] of Object.entries(ENTITY_TABLE)) {
  entities[name] = createEntityApi(tbl);
}

/** Dynamic entity access (e.g. DataImport) */
const entitiesProxy = new Proxy(entities, {
  get(target, prop) {
    if (typeof prop !== 'string') return target[prop];
    if (target[prop]) return target[prop];
    const tbl = ENTITY_TABLE[prop] || pluralizeEntity(prop);
    return createEntityApi(tbl);
  },
});

function pascalToSnake(pascal) {
  return pascal.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function pluralizeEntity(pascal) {
  const snake = pascalToSnake(pascal);
  if (snake.endsWith('y')) return `${snake.slice(0, -1)}ies`;
  if (snake.endsWith('s')) return `${snake}es`;
  return `${snake}s`;
}

const auth = {
  async me() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('Not authenticated');
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      ...user.user_metadata,
    };
  },
};

const functions = {
  async invoke(name, body) {
    const { data, error } = await supabase.functions.invoke(name, {
      body: body ?? {},
    });
    if (error) throw error;
    return data;
  },
};

const integrations = {
  Core: {
    async InvokeLLM(params) {
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: params,
      });
      if (!error && data != null) return data;
      console.warn('[OPSBRAIN] invoke-llm Edge Function missing or error; using stub.', error?.message || error);
      return {
        summary: 'Configure Supabase Edge Function `invoke-llm` for AI features.',
        metrics: [],
        insights: [],
        charts: [],
        response: '',
      };
    },

    async UploadFile({ file }) {
      const bucket = 'uploads';
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
      });
      if (upErr) {
        console.warn('[OPSBRAIN] Storage upload failed', upErr);
        throw upErr;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: publicUrl };
    },

    async ExtractDataFromUploadedFile(params) {
      const { data, error } = await supabase.functions.invoke('extract-data-from-file', {
        body: params,
      });
      if (error) {
        console.warn('[OPSBRAIN] extract-data-from-file not deployed', error);
        return { rows: [], items: [] };
      }
      return data;
    },

    async SendEmail(params) {
      const { error } = await supabase.functions.invoke('send-email', { body: params });
      if (error) console.warn('[OPSBRAIN] send-email', error);
    },
  },
};

async function loadConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((m) => ({
    role: m.role,
    content: m.content,
    id: m.id,
  }));
}

const agents = {
  async listConversations({ agent_name, metadata }) {
    let q = supabase.from('agent_conversations').select('*');
    if (agent_name) q = q.eq('agent_name', agent_name);
    const { data, error } = await q;
    if (error) throw error;
    let rows = data || [];
    if (metadata?.workspace_id) {
      rows = rows.filter((r) => r.metadata?.workspace_id === metadata.workspace_id);
    }
    return rows.map((r) => ({ id: r.id, ...r }));
  },

  async getConversation(id) {
    const { data: conv, error } = await supabase.from('agent_conversations').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!conv) throw new Error('Conversation not found');
    const messages = await loadConversationMessages(id);
    return { ...conv, messages };
  },

  async createConversation({ agent_name, metadata }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('agent_conversations')
      .insert({
        agent_name,
        metadata: metadata || {},
        user_id: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...data, messages: [] };
  },

  subscribeToConversation(conversationId, callback) {
    const channel = supabase
      .channel(`agent:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const conv = await agents.getConversation(conversationId);
          callback({ messages: conv.messages });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  async addMessage(conversation, userMessage) {
    const conversationId = typeof conversation === 'string' ? conversation : conversation.id;
    const { error } = await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      role: userMessage.role || 'user',
      content: userMessage.content,
    });
    if (error) throw error;
    const { error: fnErr } = await supabase.functions.invoke('agent-reply', {
      body: { conversation_id: conversationId, message: userMessage },
    });
    if (fnErr) {
      /* optional edge function */
    }
  },
};

const appLogs = {
  async logUserInApp(pageName) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('app_logs').insert({
      user_id: user.id,
      page: pageName,
      created_at: new Date().toISOString(),
    });
  },
};

export const opsbrain = {
  entities: entitiesProxy,
  auth,
  functions,
  integrations,
  agents,
  appLogs,
};
