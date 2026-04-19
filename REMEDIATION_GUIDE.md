# OpsBrain Codebase - Remediation Guide

## Quick Reference by Severity

### CRITICAL (Start Here) 🔴
1. Input Validation - Add Zod schemas 
2. Authorization Checks - Every function needs workspace verification
3. Sensitive Data Exposure - Stop logging secrets
4. XSS in HTML Templates - Sanitize user content
5. Webhook Signature Validation - Add idempotency

---

## Issue #1: Input Validation

### Problem
Functions accept unchecked JSON data and write directly to database.

### Vulnerable Code Example
```typescript
// connectIntegration.ts - BEFORE (VULNERABLE)
Deno.serve(async (req) => {
  const { integration_name, integration_type, credentials, settings } = await req.json();
  // ❌ No validation - could contain:
  // - 100MB payload
  // - SQL injection in string fields
  // - Executable code in credentials object
  
  const integration = await base44.entities.WorkspaceIntegration.create({
    workspace_id: workspaceId,
    integration_name,  // ❌ UNSAFE
    integration_type,  // ❌ UNSAFE  
    credentials,       // ❌ UNSAFE
    settings,          // ❌ UNSAFE
    status: 'active',
    last_sync: new Date().toISOString()
  });
});
```

### Fixed Code
```typescript
// connectIntegration.ts - AFTER (SECURE)
import { z } from 'zod';

// Define strict validation schema
const IntegrationCreateSchema = z.object({
  integration_name: z.string()
    .min(1, "Name required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid characters in name"),
  integration_type: z.enum([
    'gmail', 'googlecalendar', 'googledrive', 'stripe', 
    'slack', 'notion', 'hubspot'
  ], {
    errorMap: () => ({ message: "Unsupported integration type" })
  }),
  credentials: z.record(z.string(), z.unknown())
    .refine(
      (creds) => {
        // Validate credentials based on type
        if (integration_type === 'stripe') {
          return creds.api_key && typeof creds.api_key === 'string';
        }
        return true; // Add more per-type validation
      },
      "Invalid credentials for integration type"
    ),
  settings: z.record(z.string(), z.unknown()).optional()
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // VALIDATE INPUT FIRST
    const requestValidation = IntegrationCreateSchema.safeParse(
      await req.json()
    );
    
    if (!requestValidation.success) {
      return Response.json({
        error: 'Invalid request',
        details: requestValidation.error.errors
      }, { status: 400 });
    }

    const { integration_name, integration_type, credentials, settings } 
      = requestValidation.data; // ✅ NOW SAFE

    // ... rest of function with validated data
  } catch (error) {
    // Don't expose error details
    console.error('Integration error (details hidden)');
    return Response.json({
      error: 'Failed to create integration'
    }, { status: 500 });
  }
});
```

### Apply to All Functions
Create a validation utility file:

```typescript
// functions/utils/validation.ts
import { z } from 'zod';

export const CommonSchemas = {
  workspaceId: z.string().uuid("Invalid workspace ID"),
  userId: z.string().uuid("Invalid user ID"),
  email: z.string().email("Invalid email"),
  amount: z.number().positive("Amount must be positive").max(999999),
  date: z.string().datetime("Invalid date"),
  uuid: z.string().uuid(),
};

export const PaymentReceivedSchema = z.object({
  invoice_id: CommonSchemas.uuid,
  client_id: CommonSchemas.uuid,
  workspace_id: CommonSchemas.uuid,
  amount: CommonSchemas.amount,
  payment_method: z.enum(['stripe', 'bank', 'cash', 'check']),
  workspace_id: CommonSchemas.workspaceId,
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new RequestError(
      'Invalid request',
      400,
      result.error.errors
    );
    throw err;
  }
  return result.data;
}

// Usage:
const { invoice_id, amount } = validateRequest(
  PaymentReceivedSchema,
  await req.json()
);
```

---

## Issue #2: Authorization Checks

### Problem
Functions check authentication but not workspace authorization, allowing privilege escalation.

### Vulnerable Code
```typescript
// connectIntegration.ts - BEFORE (VULNERABLE)
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) { 
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ❌ BUG: We never verified user owns this workspace!

  const stateRecords = await base44.entities.UserWorkspaceState.filter({
    user_id: user.id
  });

  if (stateRecords.length === 0) {
    return Response.json({ error: 'No active workspace' }, { status: 400 });
  }

  // ❌ SECURITY ISSUE: Client could send any workspace_id
  // and we'd accept it because we only checked authentication
  const workspaceId = stateRecords[0].active_workspace_id; // Uses their saved one, mostly safe
  
  // But a malicious user could send workspace_id in request:
  const { workspace_id } = await req.json();
  // And override the safety!
});
```

### Fixed Code
```typescript
// Helper to check authorization
async function assertWorkspaceAccess(
  base44: any,
  userId: string,
  workspaceId: string,
  minRole: 'owner' | 'admin' | 'member' | 'viewer' = 'member'
): Promise<WorkspaceMember> {
  const membership = await base44.entities.WorkspaceMember.filter({
    user_id: userId,
    workspace_id: workspaceId,
    status: 'active'
  });

  if (!membership || membership.length === 0) {
    throw new ForbiddenError('No access to this workspace');
  }

  const member = membership[0];
  
  const roleHierarchy = { owner: 0, admin: 1, member: 2, viewer: 3 };
  if (roleHierarchy[member.role] > roleHierarchy[minRole]) {
    throw new ForbiddenError('Insufficient permissions');
  }

  return member;
}

// AFTER (SECURE)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_name, integration_type, credentials, settings } 
      = validateRequest(IntegrationCreateSchema, await req.json());

    // Get workspace ID from user state (server-side, can't be spoofed)
    const stateRecords = await base44.entities.UserWorkspaceState.filter({
      user_id: user.id
    });

    if (stateRecords.length === 0) {
      return Response.json({ error: 'No active workspace' }, { status: 400 });
    }

    const workspaceId = stateRecords[0].active_workspace_id;

    // ✅ VERIFY AUTHORIZATION
    await assertWorkspaceAccess(base44, user.id, workspaceId, 'member');

    // Now safe to proceed...
  } catch (error) {
    return handleError(error);
  }
});
```

### Implementation Checklist
For EVERY function that touches workspace data:

```typescript
// Template
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) return unauthorized();
    
    // Step 1: Get workspace from user state
    const workspace = await getUserActiveWorkspace(base44, user.id);
    if (!workspace) return Response.json({ error: 'No workspace' }, { status: 400 });
    
    // Step 2: Validate that user has access
    const membership = await assertWorkspaceAccess(
      base44, 
      user.id, 
      workspace.id,
      'member' // or 'admin' for admin operations
    );
    
    // Step 3: Validate input
    const input = validateRequest(InputSchema, await req.json());
    
    // Step 4: Only NOW use workspace.id and input in database operations
    // ✅ SAFE
  } catch (error) {
    return handleError(error);
  }
});
```

---

## Issue #3: Sensitive Data Exposure in Logs

### Problem
Error messages containing secrets logged to console/logs.

### Vulnerable Code
```typescript
// stripeWebhook.ts - BEFORE
catch (err) {
  console.error('Webhook signature verification failed:', err.message);
  // ❌ ERROR MESSAGE COULD CONTAIN:
  // - Full error stack trace with file paths
  // - Environment variable values
  // - Customer data
  // - API responses with secrets
  
  return Response.json({ error: 'Invalid signature' }, { status: 400 });
}
```

### Fixed Code
```typescript
// AFTER - Safe logging
const SAFE_LOG_FIELDS = {
  event_type: 'string',
  request_id: 'string',
  user_id: 'string',
  timestamp: 'string',
  // ❌ NEVER log: secrets, passwords, tokens, emails, IPs
};

interface SafeContext {
  requestId?: string;
  userId?: string;
  workspace_id?: string;
  eventType?: string;
}

function safeLog(level: 'info' | 'warn' | 'error', message: string, context: SafeContext = {}) {
  const logEntry = {
    level: level.toUpperCase(),
    timestamp: new Date().toISOString(),
    message: message, // User-controlled string, must be safe
    ...context
  };
  
  console[level](JSON.stringify(logEntry));
}

// USAGE - stripe webhook
try {
  event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
} catch (err) {
  safeLog('error', 'Webhook signature verification failed', {
    eventType: 'stripe_webhook_error'
  });
  // ❌ DON'T LOG: err.message, err.stack, webhookSecret
  
  return Response.json(
    { error: 'Invalid signature' }, 
    { status: 400 }
  );
}

// Safe error handling utility
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public safeMessage: string = 'An error occurred' // What to send to user
  ) {
    super(message);
  }
}

export function handleError(error: Error, context: SafeContext = {}) {
  if (error instanceof AppError) {
    safeLog('warn', `${error.statusCode} Client Error`, {
      ...context,
      eventType: error.message
    });
    
    return Response.json(
      { error: error.safeMessage },
      { status: error.statusCode }
    );
  }

  // Unexpected error - log minimally
  const requestId = crypto.randomUUID();
  safeLog('error', 'Unexpected error', {
    requestId,
    ...context
  });

  return Response.json(
    { 
      error: 'An error occurred',
      requestId // User can include this in support ticket
    },
    { status: 500 }
  );
}
```

---

## Issue #4: XSS Vulnerabilities in HTML Templates

### Problem
User-controlled data inserted into HTML without escaping.

### Vulnerable Code
```typescript
// sendEmailReport.ts - BEFORE
const { report_type, recipient_email, workspace_id } = await req.json();

// ❌ VULNERABLE if workspace_id or user data is controlled:
htmlContent = `
  <div class="header">
    <h1>Report for ${workspace_id}</h1>
    <p>User: ${user.name}</p>
  </div>
`;
// If user.name = '<img src=x onerror="fetch(malicious)">'
// XSS executed in email client
```

### Fixed Code
```typescript
// AFTER - Proper escaping
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// OR use a sanitization library:
import DOMPurify from 'isomorphic-dompurify';

const sanitize = (dirty: string) => DOMPurify.sanitize(dirty);

// USAGE
const htmlContent = `
  <div class="header">
    <h1>Report for ${escapeHTML(workspace_id)}</h1>
    <p>User: ${escapeHTML(user.name)}</p>
  </div>
`;

// TEMPLATE HELPER
function buildEmailTemplate(data: {
  title: string;
  userName: string;
  content: string;
}): string {
  return `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>${escapeHTML(data.title)}</h1>
  <p>Hello ${escapeHTML(data.userName)},</p>
  ${escapeHTML(data.content)}
</body>
</html>
  `;
}
```

---

## Issue #5: Memory Leaks in In-Memory Caches

### Problem
Unbounded Map caches grow indefinitely in Deno isolates.

### Vulnerable Code
```typescript
// syncGmail.ts - BEFORE
const cache = new Map(); // ❌ Unbounded

Deno.serve(async (req) => {
  const cacheKey = `gmail_data_${user.email}_${max_results}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      return Response.json({ ...cached.data, from_cache: true });
    }
  }
  
  // ... fetch fresh data ...
  
  cache.set(cacheKey, { 
    data, 
    expiresAt: Date.now() + 5 * 60 * 1000 
  });
  // ❌ BUG: 1000+ users, each with 5 cache entries = 5000+ map entries
  // After hours/days of use, hits memory limit and crashes
});
```

### Fixed Code
```typescript
// AFTER - LRU Cache with bounded size
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private order: K[] = []; // Track insertion order
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | null {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      // Move to end (most recently used)
      this.order = this.order.filter(k => k !== key);
      this.order.push(key);
      return value;
    }
    
    return null;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.set(key, value);
      this.order = this.order.filter(k => k !== key);
      this.order.push(key);
    } else {
      // Add new
      this.cache.set(key, value);
      this.order.push(key);
      
      // Evict oldest if at capacity
      if (this.cache.size > this.maxSize) {
        const oldestKey = this.order.shift();
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.order = [];
  }

  size(): number {
    return this.cache.size;
  }
}

// TTL wrapper for expires-at logic
class CacheEntry<T> {
  data: T;
  expiresAt: number;

  constructor(data: T, ttlMs: number) {
    this.data = data;
    this.expiresAt = Date.now() + ttlMs;
  }

  isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }
}

// USAGE
const CACHE = new LRUCache<string, CacheEntry<any>>(100); // Max 100 entries
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  const cacheKey = `gmail_data_${user.email}_${max_results}`;
  
  const cached = CACHE.get(cacheKey);
  if (cached && !cached.isExpired()) {
    return Response.json({ ...cached.data, from_cache: true });
  }

  // ... fetch fresh data ...
  
  // ✅ Now bounded to 100 entries max
  CACHE.set(cacheKey, new CacheEntry(data, CACHE_TTL_MS));
  
  return Response.json(data);
});
```

---

## Issue #6: Webhook Idempotency

### Problem
Webhook retries cause double-processing of payments/invoices.

### Vulnerable Code
```typescript
// handlePaymentReceived.ts - BEFORE
Deno.serve(async (req) => {
  const { event, data } = await req.json();

  // Stripe webhook retried = process twice
  await base44.asServiceRole.entities.Invoice.update(data.invoice_id, {
    status: 'paid' // ❌ Processed twice on retry
  });

  await base44.asServiceRole.entities.Analytics.create({
    // ❌ Duplicate analytics entry
  });

  // ❌ Notification sent twice
  // ❌ May charge user twice if not idempotent
});
```

### Fixed Code
```typescript
// AFTER - Idempotent processing
interface WebhookEventRecord {
  id: string;
  provider: string; // 'stripe'
  event_id: string; // Stripe's event ID (unique)
  event_type: string;
  processed: boolean;
  processed_at?: string;
  error?: string;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Extract event from Stripe
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // ✅ STEP 1: Check if already processed
    const existingEvent = await base44.asServiceRole.entities.WebhookEvent.filter({
      provider: 'stripe',
      event_id: event.id // Stripe provides unique event ID
    });

    if (existingEvent.length > 0 && existingEvent[0].processed) {
      // Already handled, return success (idempotent)
      console.log(`Webhook ${event.id} already processed`);
      return Response.json({ success: true, cached: true });
    }

    // ✅ STEP 2: Create placeholder record (prevent double-processing during request)
    let webhookRecord = existingEvent[0];
    
    if (!webhookRecord) {
      webhookRecord = await base44.asServiceRole.entities.WebhookEvent.create({
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        processed: false // Mark as in-progress
      });
    }

    try {
      // ✅ STEP 3: Process event
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          
          // Check if payment already recorded
          const existingPayment = await base44.asServiceRole.entities.Payment.filter({
            stripe_invoice_id: invoice.id,
            status: 'completed'
          });

          if (existingPayment.length === 0) {
            // Record payment
            await base44.asServiceRole.entities.Invoice.update(invoice.id, {
              status: 'paid',
              paid_at: new Date().toISOString()
            });

            // Record analytics
            await base44.asServiceRole.entities.Analytics.create({
              metric_name: 'payment_received',
              value: invoice.amount_paid / 100
            });

            // Send notification once
            const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
              workspace_id: invoice.metadata.workspace_id
            });

            for (const member of members) {
              await base44.asServiceRole.entities.Notification.create({
                workspace_id: invoice.metadata.workspace_id,
                user_email: member.invited_email,
                type: 'payment_received',
                message: `Payment received: $${invoice.amount_paid / 100}`
              });
            }
          }
          break;
        }
      }

      // ✅ STEP 4: Mark as processed
      await base44.asServiceRole.entities.WebhookEvent.update(webhookRecord.id, {
        processed: true,
        processed_at: new Date().toISOString()
      });

      return Response.json({ success: true });

    } catch (error) {
      // Mark as failed for retry
      await base44.asServiceRole.entities.WebhookEvent.update(webhookRecord.id, {
        error: error.message
      });

      throw error;
    }

  } catch (error) {
    console.error('Webhook processing failed');
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
});
```

---

## Issue #7: TypeScript Strict Mode

### Problem
No strict type checking enabled.

### Fix
Update `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["esnext", "dom"],
    "target": "esnext",
    
    // ✅ ADD THESE:
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnusedLabels": false,
    
    // Existing:
    "checkJs": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": []
  },
  "include": ["src/components/**/*.js", "src/pages/**/*.jsx", "src/Layout.jsx"],
  "exclude": ["node_modules", "dist", "src/vite-plugins", "src/components/ui", "src/api", "src/lib"]
}
```

Then run:
```bash
npm run typecheck
# Fix all errors that appear
```

---

## Creating Error Handling Utility

Create `functions/utils/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public safeMessage: string = 'An error occurred'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: any[] = []) {
    super(message, 400, 'Invalid request');
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'Authentication required');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'You do not have permission to access this resource');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, `${resource} not found`);
  }
}

export function handleError(error: unknown, context: Record<string, any> = {}): Response {
  if (error instanceof AppError) {
    safeLog('warn', `${error.statusCode} ${error.message}`, context);
    
    return Response.json(
      {
        error: error.safeMessage,
        ...(error instanceof ValidationError && { errors: error.errors })
      },
      { status: error.statusCode }
    );
  }

  safeLog('error', 'Unexpected error', context);
  const requestId = crypto.randomUUID();

  return Response.json(
    { 
      error: 'An error occurred',
      requestId
    },
    { status: 500 }
  );
}

function safeLog(level: string, message: string, context: Record<string, any>) {
  const safe = Object.entries(context).reduce((acc, [k, v]) => {
    // Only include safe fields
    if (['userId', 'workspaceId', 'eventType', 'requestId', 'timestamp'].includes(k)) {
      acc[k] = v;
    }
    return acc;
  }, {});

  console[level as 'error' | 'warn'](JSON.stringify({
    level: level.toUpperCase(),
    message,
    timestamp: new Date().toISOString(),
    ...safe
  }));
}
```

---

## Summary Checklist

```markdown
## Security Hardening Checklist

### Input Validation (Week 1)
- [ ] Create validation schemas for all function endpoints
- [ ] Test with SQLi, XSS, CSRF payloads
- [ ] Add max size limits to inputs
- [ ] Validate enum values strictly

### Authorization (Week 1)  
- [ ] Add workspace access check to every function
- [ ] Verify role-based permissions
- [ ] Test privilege escalation scenarios
- [ ] Audit workspace isolation

### Data Protection (Week 2)
- [ ] Remove secrets from logs
- [ ] Implement safe logging utility
- [ ] Encrypt sensitive database fields
- [ ] Add field-level access control

### Webhooks (Week 2)
- [ ] Add idempotency tracking
- [ ] Sign all webhook responses
- [ ] Validate signatures strictly
- [ ] Add replay protection

### Caching (Week 2)
- [ ] Replace Map with LRU cache
- [ ] Add TTL to all cache entries
- [ ] Add memory monitoring
- [ ] Test cache eviction

### Error Handling (Week 3)
- [ ] Create error handler utility
- [ ] Update all functions (30+ files)
- [ ] Add error tracking integration
- [ ] Update ErrorBoundary with reporting

### TypeScript (Week 3)
- [ ] Enable strict mode
- [ ] Fix type errors
- [ ] Add JSDoc for exports
- [ ] Update CI to fail on errors

### Testing (Week 4)
- [ ] Unit tests for validators
- [ ] Integration tests for auth
- [ ] Webhook tests with fakes
- [ ] Performance tests for caching

### Documentation (Week 4-5)
- [ ] API reference for all functions
- [ ] Security guidelines doc
- [ ] Setup guide with .env
- [ ] Deployment checklist
```

---

**Total Estimated Time:** 4-6 weeks with experienced team  
**Priority:** Address issues 1-5 in first sprint
