# Component Map — Premier Dealer Portal

Component hierarchy and data flow for both modules.

---

## Layout Components

```
App
├── (public)
│   ├── PublicLayout
│   │   ├── PublicHeader
│   │   └── PublicFooter
│   ├── EventsPage               → eventService.getAll(published)
│   │   └── EventCard
│   ├── RegistrationFlow          → contactService.searchByPhone() → eventService.addRegistration()
│   │   ├── PhoneVerificationStep
│   │   ├── RegistrationConfirmation
│   │   └── FallbackSignupForm    → pendingRequests.create()
│   └── BecomeDealerPage          → prospectService.create() → playbookService.getActive()
│       └── ProspectSignupForm
│
├── (admin)
│   ├── AdminLayout
│   │   ├── TopTabNav             [Premier Dealers | PD Recruitment]
│   │   ├── Sidebar               (context-dependent on active tab)
│   │   └── MainContent
│   │
│   ├── ── Premier Dealers Tab ──
│   │
│   ├── ContactsPage              → contactService
│   │   ├── ContactList
│   │   │   ├── ContactRow
│   │   │   └── ContactFilters    (categories, search)
│   │   ├── ContactDetail
│   │   │   ├── ContactInfo
│   │   │   ├── NotesPanel        → contactService.addNote()
│   │   │   ├── CategoryTags
│   │   │   └── SmsHistory        → real-time onSnapshot
│   │   └── PendingApprovalQueue
│   │       └── ApprovalCard      → contactService.create() + eventService.addRegistration()
│   │
│   ├── EventsPage                → eventService
│   │   ├── EventList
│   │   │   └── EventCard
│   │   ├── EventEditor
│   │   │   ├── EventForm
│   │   │   ├── RegistrationLog
│   │   │   ├── NotificationSequenceBuilder    → dnd-kit
│   │   │   │   └── NotificationStepCard
│   │   │   └── RecurrenceConfig
│   │   └── EventSurveyPanel      → surveyService
│   │
│   ├── MessagesPage              → messageService
│   │   ├── CreateMessageTab
│   │   │   ├── ChannelSelector
│   │   │   ├── TemplateSelector   → templateService.getAll()
│   │   │   ├── EmailComposer      (GrapesJS or AI)
│   │   │   ├── SmsComposer        (with char counter)
│   │   │   ├── AudienceSelector   → contactService (categories)
│   │   │   ├── SurveyAttacher     → surveyService.getAll()
│   │   │   ├── SchedulePicker
│   │   │   └── MultiSequenceBuilder
│   │   ├── ScheduledTab
│   │   │   └── ScheduledMessageList
│   │   └── SentTab
│   │       └── SentMessageList    (with analytics)
│   │
│   ├── TemplatesPage             → templateService
│   │   ├── TemplateList
│   │   ├── EmailTemplateEditor
│   │   │   ├── GrapesJSEditor     → grapesjs + grapesjs-preset-newsletter
│   │   │   └── AiChatPanel        → /api/ai/generate-email, /api/ai/refine-email
│   │   │       ├── SkillSelector  → skills collection
│   │   │       └── ChatHistory
│   │   └── SmsTemplateEditor
│   │       └── CharacterCounter
│   │
│   ├── SurveysPage               → surveyService
│   │   ├── SurveyList
│   │   ├── SurveyBuilder         (ported)  → @dnd-kit/sortable
│   │   │   ├── QuestionPalette
│   │   │   ├── SurveyCanvas
│   │   │   └── QuestionEditor    (ported)
│   │   └── SurveyAnalytics
│   │       └── QuestionChart
│   │
│   ├── SmsInboxPage              → real-time onSnapshot
│   │   ├── ConversationList
│   │   ├── ConversationThread
│   │   └── ReplyComposer
│   │
│   ├── SuppressionPage           → suppressionService
│   │   └── SuppressionList
│   │
│   ├── ── PD Recruitment Tab ──
│   │
│   ├── ProspectsPage             → prospectService
│   │   ├── ProspectList
│   │   │   ├── ProspectRow
│   │   │   └── ProspectFilters   (tags, status, step)
│   │   └── ProspectDetail
│   │       ├── ProspectInfo
│   │       ├── CollectedDataPanel
│   │       ├── TagManager
│   │       └── ConversationThread     → onSnapshot
│   │           ├── MessageBubble
│   │           ├── PlaybookStepIndicator
│   │           ├── HandoffBanner
│   │           ├── ModeToggle         [Auto ↔ Human]
│   │           └── CopilotSidebar     (human mode)
│   │               └── AiSuggestion
│   │
│   ├── PlaybookPage              → playbookService
│   │   ├── PlaybookStepList      → dnd-kit (reorder)
│   │   └── PlaybookStepEditor
│   │
│   ├── ConversationsPage         → prospectService.getConversation()
│   │   └── ConversationList      (all active conversations)
│   │
│   ├── ── Shared (Settings) ──
│   │
│   ├── SettingsPage
│   │   ├── ApiConnectionsTab     (Twilio, SendGrid, OpenAI)
│   │   ├── SkillsTab             → skills collection
│   │   │   └── SkillEditor
│   │   ├── CategoriesTab         → categories (contact)
│   │   └── ProspectTagsTab       → tags (prospect)
│   │
│   └── UsersLogsPage
│       ├── UserManagement        (Admin-only)
│       │   ├── UserList
│       │   └── InviteUserForm
│       └── ActivityLog
│           └── LogFilters
```

---

## Data Flow Patterns

### Real-Time Updates (onSnapshot)
- SMS Inbox ← `conversations` collection
- Prospect Conversations ← `prospects/{id}/conversations`
- Contact SMS History ← filtered `conversations`

### AI Integration Points
- **Template Editor** → `/api/ai/generate-email` → GrapesJS
- **Message Composer** → same AI flow, inline
- **Recruitment Auto Mode** → Firestore trigger → `/api/ai/recruitment-respond`
- **Copilot Sidebar** → `/api/ai/copilot-suggest`

### Webhook Data Flow
```
Twilio/SendGrid → Webhook Endpoint → Firestore Write → onSnapshot → UI Update
```

### Message Send Flow
```
Compose → Schedule → Firebase Function (cron) → Check Due → Twilio/SendGrid → Status Callback → Update Analytics
```
