# OpsBrain V1 Gap Closing Plan

## 1. Critical Blockers

### Blocker 1: No Workspace Authorization Enforcement (SECURITY)
- **Problem**: Backend queries lack permission checks. Any authenticated user can query any workspace's data by changing workspace_id.
- **Evidence**: `base44.entities.Client.filter({ workspace_id: someOtherWorkspace.id })` succeeds regardless of user's actual membership.
- **Risk Level**: HIGH - Security vulnerability before launch.
- **Impact Area**: ALL modules querying base44.entities (Clients, Projects, Documents, Team, Integrations, Dashboard, Settings).

### Blocker 2: Tasks Module Non-Existent
- **Problem**: Tasks only exist as project sub-items. No independent task page, list, or CRUD.
- **Evidence**: `src/components/tasks/` only contains SmartReminders.jsx. No TasksPage or TaskListPage.
- **Current State**: Users cannot create tasks from Dashboard. Cannot search/filter tasks. Cannot assign independent tasks.
- **Impact Area**: Core user workflow gaps.

### Blocker 3: Fake-Complete Areas Mislead Users  
- **Problem**: Users see buttons for features that don't work (Document OCR, integration sync, calendar).
- **Evidence**: Integration sync: `Math.floor(Math.random() * 100) + 10` generates fake data. Document components (OCRExtractor.jsx, DocumentAutoTagger.jsx) render but don't call backend.
- **Risk Level**: MEDIUM - Undermines product credibility.
- **Impact Area**: Documents, Integrations, Calendar pages.

### Blocker 4: Onboarding Not Persistent
- **Problem**: Module selections on onboarding page aren't saved. Business type not linked to workspace.
- **Evidence**: `src/pages/Onboarding.jsx` renders ModuleSelector but selections aren't persisted; no API call to save preferences.
- **Impact Area**: First-time user experience.

---

## 2. Highest-Priority Implementation Sequence

### PHASE 1: SECURITY FOUNDATION (Days 1-2, ~8-10 hours)
**Goal**: Make it impossible for users to access other workspaces' data.

**What to do**:
1. Add workspace membership check to all backend queries
2. Create a security validation layer or audit backend functions
3. Test workspace isolation: User A cannot see User B's clients when workspace IDs differ

**Entry point**: 
- Functions in `functions/` directory need to check that the requesting user is a WorkspaceMember of the target workspace_id
- Frontend queries already filter by activeWorkspace.id, but backend must verify

**Effort**: 2-3 days total

---

### PHASE 2: HIDE FAKE FEATURES (Day 1, ~2-3 hours)
**Goal**: Remove misleading UI elements from product on v1 launch.

**What to do**:
1. Hide Integrations from main navigation → Redirect to deferred messaging
2. Hide Calendar from main navigation → Redirect to deferred messaging
3. Remove Document "smart feature" buttons (OCR, tagging, versioning) from DocumentDetailView
4. Remove commented/deferred Dashboard features
5. Add feature flags or comments marking these as "v1.1 coming soon"

**Specific files**:
- `src/components/navigation/Sidebar.jsx` - Remove Integrations, Calendar menu items
- `src/pages/Documents.jsx` - Hide OCRExtractor, DocumentAutoTagger, DocumentVersioning buttons
- `src/pages/Dashboard.jsx` - Remove ProactiveInsights, ProactiveAlerts lazy imports
- `src/components/documents/DocumentDetailView.jsx` - Hide smart feature buttons

**Effort**: 2-3 hours

---

### PHASE 3: BUILD TASKS MODULE (Days 2-4, ~8-10 hours)
**Goal**: Create independent task management for users.

**What to do**:
1. Create `src/pages/TaskList.jsx` with real task CRUD
2. Create task creation modal: `src/components/tasks/TaskCreateModal.jsx`
3. Add filtering/search by status, due date, assigned user
4. Link tasks to projects (show project context but allow independent creation)
5. Ensure real-time subscription to task updates

**Data model**:
- Use existing `base44.entities.Task` which supports: `title`, `description`, `status` (open/completed), `assigned_to` (user email), `project_id` (optional), `workspace_id`, `due_date`
- Tasks should be created with `workspace_id` for cross-project visibility

**Minimal v1 Requirements**:
- Task list with columns: Title, Status, Assigned to, Due Date
- Create task modal (independent, no project required)
- Complete/uncomplete toggle
- Delete task
- Optional: Assign to team member
- Optional: Link to project

**Entry point Files**:
- Task creation mutation in `src/pages/TaskList.jsx`: `base44.entities.Task.create({ workspace_id, title, assigned_to, status: 'open', ... })`
- Task list query: `base44.entities.Task.filter({ workspace_id }, '-created_date')`
- Real-time subscription: `base44.entities.Task.subscribe((task) => queryClient.invalidateQueries())`

**Effort**: 5-8 hours

---

### PHASE 4: PERSIST ONBOARDING (Day 1.5, ~3-4 hours)
**Goal**: Save user's business type and module preferences.

**What to do**:
1. On Onboarding, save selected business type to Workspace record
2. Save selected modules to user preferences or UserWorkspaceState
3. Show "Onboarding complete" state instead of repeating on subsequent visits
4. Link business type to recommended feature set

**Entry point Files**:
- `src/pages/Onboarding.jsx`: Call mutation when "Complete Setup" clicked
- Mutation: `base44.entities.Workspace.update(workspace_id, { business_type: selectedType })`
- Also create UserModulePreferences record or add to UserWorkspaceState: `{ workspace_id, user_id, modules_enabled: [...] }`
- On re-entry to onboarding, check if Workspace already has `business_type` and show "Already Configured" instead

**Minimal v1 Requirements**:
- Save business_type to Workspace
- Mark onboarding as complete (add `onboarding_completed_at` timestamp)
- Don't repeat onboarding if already completed

**Effort**: 3-4 hours

---

### PHASE 5: VALIDATE END-TO-END V1 FLOWS (Day 5, ~4 hours)
**Goal**: Ensure a new user can complete realistic v1 workflows.

**Test Flows**:
1. **Team Setup Flow**: Invite team member → Member accepts via email → Appears in Team page → Can assign tasks
2. **Client Management Flow**: Create client → List clients → Filter by status → Create project for client → View client-linked project
3. **Project Workflow**: Create project → Create tasks within project → View project dashboard → Update task status → See project progress
4. **Document Handling**: Upload document → Tag with category → View in list → Filter by category → Search by name
5. **Chat Communication**: Send message → Message appears in real-time → Agent responds → See response in conversation

**Testing Checklist**:
- [ ] New workspace automatically created on first login
- [ ] Team invite sends real email with workspace context
- [ ] Invited user auto-accepts and joins workspace
- [ ] User cannot see other workspaces' data
- [ ] Task list works independently and within projects
- [ ] Document filtering works
- [ ] Chat messages persist and sync real-time
- [ ] Dashboard widgets customize and save preferences

**Effort**: 4 hours (mostly manual testing)

---

## 3. Security / Authorization Fixes

### The Vulnerability
Currently, the backend does NOT verify workspace membership when querying data. Example:
```javascript
// Frontend filters to activeWorkspace (safe)
const clients = await base44.entities.Client.filter({
  workspace_id: activeWorkspace.id  // User's workspace
});

// But if user manually changes ID or uses API...
const otherClients = await base44.entities.Client.filter({
  workspace_id: "some-other-workspace-id"  // ← Backend doesn't check membership
});
```

### Where Authorization Must Be Added

**1. Backend Functions** (`functions/*.ts`)
- `getWorkspaceIntegrations.ts` - Already checks user auth but NOT workspace membership
- `connectIntegration.ts` - Same issue
- ALL functions that access workspace-specific data must verify user is WorkspaceMember

**2. Frontend Pre-Flight Check**
- Before ANY `base44.entities` query, verify `activeWorkspace` includes current user in `workspace_members`
- This is already done implicitly via WorkspaceContext, but should be explicit

**3. Backend Security Layer (Most Important)**
- Add a helper function to ALL base44.entities queries in backend functions:
```typescript
async function verifyWorkspaceAccess(userId: string, workspaceId: string) {
  const member = await base44.entities.WorkspaceMember.filter({
    user_id: userId,
    workspace_id: workspaceId,
    status: ['active', 'pending']
  });
  if (!member.length) throw new Error('Access denied');
  return member[0];
}
```

**4. Specific Modules to Fix**
- `getWorkspaceIntegrations.ts` - Add workspace membership check after auth check
- All frontend queries in pages (`Clients.jsx`, `Projects.jsx`, `Documents.jsx`, `Team.jsx`, etc.) - should already be safe due to activeWorkspace context filter
- Dashboard queries - check workspace_id matches activeWorkspace

### Implementation Checklist
- [ ] Add authorization check to `getWorkspaceIntegrations.ts`
- [ ] Audit all backend functions for workspace queries
- [ ] Add workspace membership verification before any data access
- [ ] Test cross-workspace data isolation
- [ ] Document authorization pattern for future functions

**Estimated Effort**: 2-3 days (mostly audit + testing)

---

## 4. Tasks Module Plan

### Current State
- Tasks data model exists: `base44.entities.Task`
- Tasks CRUD works within projects: `ProjectDetailPanel` has full task management
- SmartReminders component exists but is for notifications, not task management

### What's Missing
- **No independent task page**: Users cannot view/create/manage tasks outside of projects
- **No task list view**: Cannot see all tasks across projects
- **No task search/filter**: Cannot find tasks by title, status, or assignee
- **No task assignment UI**: Cannot assign standalone tasks to team members (only within project context)
- **No task notifications**: No reminders or due date alerts

### Minimal v1 Tasks Module

#### Page: `src/pages/TaskList.jsx`
```
Display:
- Table with columns: Title | Status | Due Date | Assigned To | Project (if any) | Actions
- Filter buttons: All / Open / Completed / This week / Overdue
- Search box: Filter by title
- "Create Task" button (modal)

CRUD Operations:
- Create: Modal with title, description, due date, assigned to (optional), project (optional)
- Read: List all workspace tasks, real-time subscription
- Update: Toggle status (open ↔ completed), edit title/date by clicking row
- Delete: Delete button with confirmation
```

#### Components to Create
1. `src/components/tasks/TaskListTable.jsx` - Main table display
2. `src/components/tasks/TaskCreateModal.jsx` - Create/edit modal
3. `src/components/tasks/TaskStatusBadge.jsx` - Visual status indicator
4. `src/components/tasks/TaskFilters.jsx` - Filter controls (optional, can inline)

#### Data Flow
```javascript
// Query all workspace tasks
const { data: tasks } = useQuery({
  queryKey: ['tasks', activeWorkspace?.id],
  queryFn: async () => {
    if (!activeWorkspace) return [];
    return await base44.entities.Task.filter({
      workspace_id: activeWorkspace.id
    }, '-due_date'); // Newest first
  }
});

// Create task
const createMutation = useMutation({
  mutationFn: (data) => base44.entities.Task.create({
    workspace_id: activeWorkspace.id,
    status: 'open',
    ...data
  })
});

// Real-time updates
useEffect(() => {
  const unsubscribe = base44.entities.Task.subscribe((task) => {
    if (task.workspace_id === activeWorkspace.id) {
      queryClient.invalidateQueries(['tasks']);
    }
  });
  return unsubscribe;
}, [activeWorkspace.id]);
```

#### Task Fields
- `id` (auto)
- `workspace_id` (required)
- `title` (required)
- `description` (optional)
- `status` ('open' | 'completed')
- `assigned_to` (optional, user email)
- `due_date` (optional, ISO date)
- `project_id` (optional, for context)
- `created_at` (auto)
- `created_by` (user email)

#### Integration with Projects
- When viewing ProjectDetailPanel, show related tasks marked with "project:xxx" tag
- When creating standalone task, optionally link to project
- Project progress bar sums based on project-tagged tasks

**Estimated Effort**: 6-8 hours for minimal v1 (full-featured would be 10+ hours)

---

## 5. Fake-Complete Areas to Hide or Defer

### HIDE from Navigation Immediately

#### 1. Integrations Page
- **Current state**: UI shows 30 integrations, sync button, but sync is completely mocked (random data)
- **Why hide**: Misleads users into thinking they're syncing data. They're not.
- **Action**: 
  - Comment out Integrations from sidebar navigation
  - Redirect any direct /integrations URL to Settings with banner: "Integrations coming in v1.1"
  - Keep code but don't expose in v1
- **Files to modify**:
  - `src/components/navigation/Sidebar.jsx` - Remove Integrations menu item
  - `src/pages/Integrations.jsx` - Add redirect/message at top
  - `src/pages/Settings.jsx` - Integration hub section → Move behind "Coming Soon" banner

#### 2. Calendar Page
- **Current state**: Page renders but cannot create events. No Google Sync. Just a wrapper.
- **Why hide**: Users expect interactive calendar; feature is non-functional.
- **Action**:
  - Comment out Calendar from sidebar navigation
  - Hide route or redirect to Settings
  - Move implementation to v1.1 roadmap
- **Files to modify**:
  - `src/components/navigation/Sidebar.jsx` - Remove Calendar menu item
  - `src/pages/Calendar.jsx` - Add redirect/message

#### 3. Document "Smart" Features
- **Current state**: OCRExtractor, DocumentAutoTagger, DocumentVersioning buttons render but do nothing (no backend)
- **Why hide**: Users click buttons expecting ML magic; nothing happens. Undermines trust.
- **Action**:
  - Remove from DocumentDetailView
  - OR comment out in future release flag section
  - If keeping, add disabled state + "Coming in v1.1" tooltip
- **Files to modify**:
  - `src/components/documents/DocumentDetailView.jsx` - Don't render SmartImport, OCR, Tagging buttons yet
  - OR add feature flag: `if (featureFlags.documentSmartFeatures) { <OCRButton /> }`

#### 4. Dashboard Deferred Components
- **Current state**: ProactiveInsights, ProactiveAlerts, CashFlowForecast commented in code
- **Why clean up**: Code clutter, confuses developers about what's in v1
- **Action**:
  - Move lazy imports to a separate `src/pages/Dashboard.deferred.jsx` file
  - OR delete entirely and re-add from git history if needed
  - Keep only 7 basic widgets: Gmail, Calendar, Tasks, Messages, WhatsApp, Revenue, QuickTasks
- **Files to modify**:
  - `src/pages/Dashboard.jsx` - Remove commented imports, clean up section

### Specific UI Changes

**Sidebar Navigation V1 Structure** (example):
```
- Dashboard ✓
- Clients ✓
- Projects ✓
- Documents ✓
- Team ✓
- [Tasks] (after building)
- [Chat] ✓ (functional, but UX needs polish)
- [Settings] ✓

Hidden in v1 (but available in v1.1):
- Integrations
- Calendar
- Finance
- Invoices
- Marketplace
- Reports
- Subscriptions
```

---

## 6. Onboarding Persistence Fixes

### Current Behavior
1. User lands on `/onboarding`
2. Selects business type (restaurant, consultant, etc.)
3. Sees module recommendations
4. Clicks "Complete" or "Get Started"
5. **Problem**: Selections not saved. Next time user logs in, they see onboarding again.

### What Must Change

#### 1. Save Business Type to Workspace
On "Complete Setup" in Onboarding:
```javascript
const handleCompleteOnboarding = async (selectedBusinessType) => {
  await base44.entities.Workspace.update(activeWorkspace.id, {
    business_type: selectedBusinessType,
    onboarding_completed_at: new Date().toISOString()
  });
  
  // Redirect to dashboard
  navigate('/');
};
```

#### 2. Check Completion Status on App Boot
In `src/lib/AuthContext.jsx` or `src/pages/AppWrapper.jsx`:
```javascript
// On user login/workspace selection
const workspaceData = await base44.entities.Workspace.read(activeWorkspace.id);

if (!workspaceData.onboarding_completed_at) {
  // Show onboarding
  navigate('/onboarding');
} else {
  // Go to dashboard
  navigate('/');
}
```

#### 3. Show "Already Configured" on Re-Entry
If user manually goes back to `/onboarding` after completing:
```javascript
// In Onboarding.jsx
const { data: workspace } = useQuery({
  queryFn: () => base44.entities.Workspace.read(activeWorkspace.id)
});

if (workspace?.onboarding_completed_at) {
  return (
    <div>
      <p>✅ Onboarding complete!</p>
      <p>Business type: {workspace.business_type}</p>
      <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
    </div>
  );
}
```

#### 4. Optional: Save Module Selections
For future personalization:
```javascript
// On onboarding complete, also save
await base44.entities.UserWorkspaceState.update(activeWorkspace.id, {
  enabled_modules: ['dashboard', 'clients', 'projects', 'documents', 'team', 'tasks'],
  business_type: selectedBusinessType
});
```

### Files to Modify
- `src/pages/Onboarding.jsx` - Add completion mutation
- `src/pages/AppWrapper.jsx` or `src/lib/AuthContext.jsx` - Check completion on app boot
- `src/components/workspace/WorkspaceContext.jsx` - May need to handle redirect logic

**Estimated Effort**: 2-3 hours

---

## 7. End-to-End V1 Flow Definition

### Flow 1: Team Workspace Setup (NEW USER)
**Goal**: New user creates workspace and invites team.

**Steps**:
1. User signs up / logs in first time
2. System auto-creates default workspace
3. User lands on Onboarding
4. Selects business type (e.g., "Marketing Agency")
5. System shows recommended modules (Team, Projects, Documents)
6. User clicks "Complete Setup"
7. Workspace saved with business_type
8. User redirected to Dashboard
9. Onboarding never shows again

**Check Points**:
- ✓ Workspace created with user_id
- ✓ Business type persisted
- ✓ Next login goes to Dashboard, not Onboarding

---

### Flow 2: Client Management (CORE WORKFLOW)
**Goal**: User creates client and links to project.

**Steps**:
1. User goes to Clients page
2. Clicks "Add Client"
3. Fills form: Name, Email, Company, Status
4. Client created and appears in list
5. User filters clients by "Active"
6. User goes to Projects, creates project
7. Optionally links project to client (future: show client context)
8. User clicks on project to view details

**Check Points**:
- ✓ Client created with workspace_id
- ✓ Client appears in list immediately
- ✓ Filter by status works
- ✓ Real-time updates if team member creates client simultaneously
- ✓ User cannot see other workspace's clients

---

### Flow 3: Project & Task Workflow (CORE WORKFLOW)
**Goal**: User creates project with tasks and tracks progress.

**Steps**:
1. User goes to Projects
2. Creates folder (optional organization)
3. Creates project within folder
4. Adds title, description, due date
5. Views project detail panel
6. Creates first task within project
7. Task appears in project progress
8. User goes to Task List page (NEW!)
9. Sees task across all projects
10. Completes task, project progress updates
11. Returns to Projects, sees project progress bar

**Check Points**:
- ✓ Project created with workspace_id
- ✓ Task created linked to project
- ✓ Task list shows independent tasks + project tasks
- ✓ Task completion updates real-time
- ✓ Project progress recalculates

---

### Flow 4: Team Collaboration (CORE WORKFLOW)
**Goal**: User invites team member who assigns tasks.

**Steps**:
1. User goes to Team page
2. Clicks "Invite Member"
3. Enters team member email, selects role (Member)
4. System sends HTML email with workspace link
5. Team member receives email, clicks link
6. Team member auto-accepts invitation (email match)
7. Workspace selector shows new workspace
8. Team member joins dashboard
9. Can see clients, projects, tasks
10. Can create/assign tasks
11. Original user receives real-time updates

**Check Points**:
- ✓ Email invitation sent with workspace context
- ✓ Email link auto-accepts on click
- ✓ New member joins with email
- ✓ Both users see same workspace data
- ✓ Role-based visibility (not enforced yet but prepared)

---

### Flow 5: Document Management (SUPPORTING WORKFLOW)
**Goal**: User organizes and shares documents.

**Steps**:
1. User goes to Documents
2. Creates folder (e.g., "Contracts")
3. Uploads document with title, category, tags
4. Document appears in grid/list
5. User filters by category
6. User searches by name
7. User deletes old document
8. Team member sees same documents in real-time

**Check Points**:
- ✓ Folder created with workspace_id
- ✓ Document with metadata saved
- ✓ Category enforcement works
- ✓ Search/filter responsive
- ✓ Real-time sync across users

---

### Flow 6: Dashboard Customization (ENTRY POINT)
**Goal**: User personalizes dashboard widgets.

**Steps**:
1. User logs in, sees Dashboard
2. Default widgets: Gmail, Calendar, Tasks, Messages
3. User removes Calendar widget
4. User adds another Revenue widget
5. User reorders widgets
6. User logs out and logs back in
7. Dashboard shows same customization

**Check Points**:
- ✓ Widget preferences saved per user
- ✓ Reorder persists
- ✓ Hide/show persists
- ✓ Next session loads same layout

---

### Flow 7: Chat Communication (SUPPORTING WORKFLOW)
**Goal**: User chats with AI assistant about workspace tasks.

**Steps**:
1. User goes to Chat
2. Types: "Show me open tasks"
3. Message sent and appears in conversation
4. Agent processes request (subscribed in real-time)
5. Agent responds with task list
6. User types follow-up
7. Conversation history shows both messages
8. User goes back to Chat list, sees conversation

**Check Points**:
- ✓ Message sends successfully
- ✓ Real-time subscription shows agent response
- ✓ Conversation persists
- ✓ Can switch between conversations

---

## 8. Recommended Next Execution Block

### Block 1: SECURITY + HONEST PRODUCT (Hours 1-6, ~1 day)
**Start Here**

This block delivers maximum credibility with minimal scope:

**What to Do**:
1. **Add workspace membership check** to backend functions (30 min)
   - Edit `functions/getWorkspaceIntegrations.ts`: Add workspace membership verification
   - Test that non-members cannot query other workspaces
   
2. **Hide Integrations, Calendar from navigation** (45 min)
   - Edit `src/components/navigation/Sidebar.jsx`: Remove Integrations, Calendar menu items
   - Add comment: `// v1.1 feature`
   
3. **Hide Document smart features** (45 min)
   - Edit `src/components/documents/DocumentDetailView.jsx`: Comment out OCRExtractor, DocumentAutoTagger, DocumentVersioning render blocks
   - Add placeholder: "OCR and advanced tagging coming in v1.1"

4. **Clean Dashboard deferred code** (30 min)
   - Edit `src/pages/Dashboard.jsx`: Remove commented lazy imports for ProactiveInsights, CashFlowForecast
   - Document future location if needed

5. **Test workspace isolation** (2 hours)
   - Create two test users
   - Have each user create workspace
   - Verify User A cannot see User B's clients/projects
   - Document test results

**Why Start Here**:
- Removes credibility-damaging fake features
- Adds foundational security check
- Prepares honest product shell for v1
- Takes only 1 day but unlocks subsequent work
- Low risk, high confidence changes

**Success Criteria**:
- No Integrations/Calendar visible in sidebar
- Smart feature buttons hidden in Documents
- Backend checks workspace membership
- Cross-user data isolation verified
- No broken flows

---

### Block 2: TASKS MODULE (Hours 7-16, ~1-2 days)
**Depends on Block 1**

Once product is honest:

**What to Do**:
1. Create `src/pages/TaskList.jsx` with table, filters, search
2. Create `src/components/tasks/TaskCreateModal.jsx`
3. Add real-time subscription
4. Integrate task queries with project context
5. Test complete/uncomplete workflow

**Success Criteria**:
- Users can create independent tasks
- Task list shows workspace tasks across all projects
- Filter by status/date works
- Real-time updates when team member creates task
- Tasks linked to projects show project context

---

### Block 3: ONBOARDING PERSISTENCE (Hours 17-20, ~4 hours)
**Depends on Block 1**

**What to Do**:
1. Add mutation in Onboarding to save business type
2. Check completion status on app boot
3. Show "Already Configured" if completed
4. Test: New user → Onboarding → Complete → Dashboard → Logout → Login → Dashboard (not Onboarding)

**Success Criteria**:
- Business type persists to Workspace record
- Onboarding not repeated after completion
- App boot respects onboarding_completed_at flag

---

### Block 4: END-TO-END VALIDATION (Hours 21-24, ~4 hours)
**Depends on Blocks 1-3**

**What to Do**:
1. Manual testing of all 7 flows defined above
2. Document blockers/bugs found
3. Create test checklist for team
4. Record: "v1 Ready for QA Testing"

**Success Criteria**:
- All 7 flows completable without errors
- Security verified (no cross-workspace data leakage)
- No fake features visible
- Real data persistence confirmed

---

## Summary: Prioritized Implementation Path

```
Week 1:
├─ Day 1: Block 1 (Security + Honest Product) - 1 day
├─ Day 2-3: Block 2 (Tasks Module) - 1.5 days  
├─ Day 4: Block 3 (Onboarding Persistence) - 0.5 day
└─ Day 5: Block 4 (E2E Validation) - 1 day
   (+ 1 day buffer for bugs/fixes)

Total: 5 days = 1 week

Then: Ready for v1 beta launch
```

### Why This Order
1. **Security first**: Blocks all other work if not addressed
2. **Honest product**: Makes team confident in the shell
3. **Tasks module**: Closes most important feature gap
4. **Onboarding**: Improves first-time user experience
5. **Validation**: Confirms all pieces work together

### What You'll Have After This Week
✅ Secure multi-workspace isolation
✅ No misleading fake features  
✅ Functional task management
✅ Persistent onboarding/setup
✅ All core v1 workflows verified
✅ Ready for limited beta launch

### What You WON'T Do (Stays Deferred)
- Integrations/data sync
- Calendar event management
- Document AI/OCR
- Finance/Invoicing
- Advanced customization
- Marketplace features
