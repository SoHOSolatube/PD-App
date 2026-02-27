# Premier Dealer Portal — Architecture & Tech Stack

## Project Overview

The Premier Dealer Portal is a web application hosted at `pd.solatube.tools` that serves two primary purposes:

1. **Premier Dealer Management** — Event planning, communication, and engagement with existing premier dealers
2. **PD Recruitment** — Automated AI-powered qualification and outreach to prospective premier dealers

The app consists of a public-facing frontend for dealers/prospects and a hidden admin backend for internal team management.

---

## Tech Stack

### Framework & Hosting

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Hosting | Firebase Hosting |
| Database | Cloud Firestore |
| Server Functions | Firebase Edge Functions (Cloud Functions) |
| File Storage | Firebase Storage (images, assets) |
| Authentication | Firebase Authentication |

### Frontend Libraries

| Library | Purpose |
|---|---|
| shadcn/ui | UI component library |
| Tailwind CSS | Utility-first CSS styling |
| GrapesJS + grapesjs-preset-newsletter | Drag-and-drop email template builder (open-source, npm package — not an API) |
| @dnd-kit/sortable | Drag-and-drop reordering (surveys, message sequences) |

### Third-Party Integrations

| Service | Purpose |
|---|---|
| Twilio | SMS sending and receiving (inbound webhooks) |
| Twilio SendGrid | Email sending, unsubscribe handling (webhooks) |
| OpenAI API | AI-powered email generation, AI recruitment agent, AI copilot |

---

## Domain & Routing

- **Domain:** `pd.solatube.tools`
- **Frontend (public):** `pd.solatube.tools/` — event listing, dealer registration, recruitment landing page
- **Admin (hidden):** `pd.solatube.tools/[obscure-path]` — no login button or link on the public site. Admin portal is accessed via an intentionally non-obvious URL path (e.g., `/gate/8x3kq` or similar random slug). Exact path to be determined.

---

## Authentication & Roles

### Authentication

- Firebase Authentication for all admin/manager logins
- No public-facing login page — admin URL is shared directly with authorized users
- Users are invited via email from the Users management section

### Roles

| Role | Access |
|---|---|
| Admin | Full access — all features, settings, API connections, user management |
| Manager | All features except: Settings page, User management (invite, role changes, password resets) |

Both roles can create, edit, and delete contacts, events, messages, surveys, and prospects.

---

## App Structure — Top-Level Navigation

The admin backend uses a **two-tab system** at the top of the page:

1. **Premier Dealers** — Events, contacts, messaging, surveys, SMS inbox, templates, suppression list
2. **PD Recruitment** — Prospect profiles, AI qualification workflows, recruitment messaging

Each tab displays its own sidebar navigation. The **Settings** section appears at the bottom of the sidebar regardless of which tab is active.

### Shared Sections (visible in both tabs)

- **Settings** — API connections (Twilio, SendGrid, OpenAI), AI skills/prompts, contact categories, prospect tags
- **Users & Logs** — User management (Admin only), activity logs

---

## Database Architecture (Firestore)

### Key Collections

- `contacts` — Premier dealer contact records (name, phone, email, notes, categories, opt-out status, SMS history)
- `events` — Event records (title, description, schedule, recurrence, status: draft/published, notification sequences)
- `events/{eventId}/registrations` — Registration records per event (contact reference, registration timestamp)
- `events/{eventId}/surveys` — Surveys tied to specific events
- `events/{eventId}/surveyResponses` — Survey response data
- `messages` — Broadcast messages and sequences (scheduled, sent, draft)
- `templates` — Email and SMS templates
- `surveys` — Survey template library
- `suppression` — Opt-out records (email and SMS, synced to contact records)
- `prospects` — Recruitment prospect profiles (name, phone, email, business info, tags, qualification status, playbook step)
- `prospects/{prospectId}/conversations` — AI and human conversation history
- `playbooks` — Qualification playbook step configurations
- `skills` — AI prompt/skill configurations (brand guidelines, colors, tone, reference images)
- `users` — Admin/manager user records and roles
- `logs` — Activity log entries (messages sent, events created/edited/deleted, user actions)
- `pendingRequests` — Dealer signup requests awaiting admin approval

---

## Real-Time Features

- **SMS Inbox** — Uses Firestore `onSnapshot` listeners for real-time inbound SMS display. Twilio webhook → Firebase Edge Function → writes to Firestore → frontend listener picks up instantly.
- **Prospect Conversations** — Real-time updates as AI sends/receives messages during recruitment flows.

---

## AI Integration Architecture

### Skills System

"Skills" are reusable AI prompt configurations stored in Firestore. Each skill defines a complete brand package:

- Color palette
- Tone of voice
- Layout preferences
- Reference images
- Any other style guidelines

When using AI features (email generation, recruitment messaging), the user selects one skill per interaction. The skill's prompt is included in the OpenAI API call to guide the output.

### AI Usage Points

1. **Email Template Builder** — Generate email templates from natural language descriptions. Supports iterative chat (generate → refine → refine). Current HTML state from GrapesJS editor is sent back to OpenAI as context for each refinement. AI and visual editor work in tandem — user can bounce between AI and manual editing freely.

2. **Broadcast Messaging** — Same AI generation capability available when composing one-off or scheduled messages.

3. **Recruitment Agent (Auto Mode)** — AI drives conversations with prospects following a configurable playbook. Each step has goals, info to collect, and criteria for advancement. AI handles natural conversation while staying on track with the playbook structure.

4. **Recruitment Copilot (Human Mode)** — Once a prospect is handed off to a human, AI shifts to a sidebar assistant role. Can draft suggested messages, answer product questions, and provide context. Human reviews and approves before anything is sent. A dedicated skill/prompt in settings defines the AI's behavior in this support role.

### GrapesJS + OpenAI Integration

The email builder integration works as a two-way flow:

1. AI generates HTML → loaded into GrapesJS editor
2. User can manually edit in the visual editor
3. User can return to AI chat, request changes → current HTML from editor is sent to OpenAI → updated HTML reloads into editor
4. Process repeats — user freely bounces between AI and visual editing

**Technical consideration:** OpenAI prompts must be constrained to output GrapesJS-compatible HTML so the editor can parse and render it correctly as draggable blocks. This is a key technical challenge to solve during development.

---

## Opt-Out / Suppression Handling

### SMS Opt-Outs

- Twilio's built-in opt-out management handles standard keywords (STOP, UNSUBSCRIBE, QUIT, CANCEL, etc.)
- Opt-out events sync back to the app via webhook → Firebase Edge Function → updates suppression list + contact/prospect record

### Email Opt-Outs

- Standard unsubscribe link included in all email footers (CAN-SPAM compliance)
- SendGrid handles unsubscribe events → webhook → Firebase Edge Function → updates suppression list + contact/prospect record

### Suppression List

- Dedicated admin section showing all opt-outs (email and SMS)
- Each contact/prospect record also flagged with opt-out status ("Opted out of Email," "Opted out of SMS")
- Automated message sequences automatically skip suppressed contacts/prospects
- Suppression handling applies to both the Premier Dealer and PD Recruitment modules

---

## Survey Builder

The survey builder is a **custom port from an existing internal project** — no external survey library is used.

### Dependencies

- `@dnd-kit/sortable` — drag-and-drop question reordering (only external dependency)

### Supported Question Types

- Single Choice
- Multiple Choice (multi-select)
- True / False
- Short Answer
- Long Answer
- Star Rating
- Number Scale (0–10)
- Likert Scale
- Dropdown
- Ranking

### Key Components (ported from existing project)

- `SurveyBuilder.tsx` — Main builder component with question type palette + survey canvas
- `QuestionEditor.tsx` — Individual question editing UI (to be located in existing project)
- `survey.ts` — Type definitions (`SurveyQuestion`, `QuestionType`, `Survey`, `SurveyResponse`, `SurveyAttachment`)
- `surveyService.ts` — Firestore CRUD for surveys (scoped under events)
- `surveyResponseService.ts` — Response submission, duplicate prevention via tracking tokens, aggregation for analytics

### Adaptations Needed

- Make event ID dynamic (currently hardcoded as `default-event-2026`)
- Build a survey renderer component for the dealer-facing side (displays survey when link is clicked)
- Locate and port the `QuestionEditor.tsx` component from the existing project

---

## Logging

All activity is logged to the `logs` collection with the following tracked actions:

- **Messaging:** All outbound SMS and email — what was sent, who set it up, when, message type
- **Events:** Created, edited, deleted — by whom and when

Logs are filterable and sortable by:

- User
- Date
- Action type (message sent, event created, event edited, event deleted)
