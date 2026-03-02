# Build Phases — Premier Dealer Portal

Phased build order from foundational to advanced features. Each phase builds on the previous one.

### Status Key

| Icon | Meaning |
|---|---|
| ✅ | Fully built and functional |
| 🔶 | Partially built — UI exists but integration is stubbed, incomplete, or has gaps vs. spec |
| ❌ | Not yet started |

---

## Phase 1: Core Foundation
**Goal:** Authentication, layout, navigation, basic CRUD infrastructure

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 1.1 | Firebase Auth integration (login/logout) | Firebase config | S | ✅ | `AuthContext`, login page, role gating |
| 1.2 | Admin layout (two-tab nav + sidebar) | Auth | M | ✅ | Premier Dealers + PD Recruitment tabs, collapsible sidebar |
| 1.3 | User management (invite, roles, list) | Auth, Firestore | M | ✅ | Invite, role change, delete in `users-logs/page.tsx` |
| 1.4 | Settings page shell (API connections) | Layout | S | ✅ | Twilio/SendGrid/OpenAI keys saved to Firestore via `settingsService`; toast feedback on save |
| 1.5 | Activity logging infrastructure | Firestore | S | ✅ | `LogsTab` in users-logs, filterable logs list |

**Deliverable:** Authenticated admin dashboard with navigation skeleton

---

## Phase 2: Contact Management
**Goal:** Full contact CRUD with categories and notes

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 2.1 | Contact list view (sortable, filterable) | Layout | M | ✅ | Sort by name/email/date, filter by category |
| 2.2 | Contact CRUD (add, edit, delete) | Contact service | M | ✅ | `ContactDialog` with inline editing |
| 2.3 | Contact categories (manage in Settings) | Settings | S | ✅ | Full CRUD in Settings > Categories tab |
| 2.4 | Notes system (add/view notes per contact) | Contact CRUD | S | ✅ | `ContactNotes` component |
| 2.5 | Pending approval queue (dealer signups) | Contact CRUD | M | ✅ | `PendingApprovalQueue` component with approve/deny |

**Deliverable:** Fully functional contact management with categories

---

## Phase 3: Templates & Email Builder
**Goal:** GrapesJS email builder + SMS templates with AI generation

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 3.1 | SMS template editor (with char counter) | Template service | M | ✅ | `SmsTemplateEditor` with character limits |
| 3.2 | GrapesJS email editor integration | Template service | L | ✅ | `EmailEditor` with newsletter preset |
| 3.3 | AI Skills management (Settings) | OpenAI config | M | ✅ | Full CRUD in Settings > AI Skills tab |
| 3.4 | AI email generation (prompt → HTML → GrapesJS) | Skills, GrapesJS | L | ✅ | `AiGenerateDialog`, `/api/ai/generate-email` route |
| 3.5 | AI refinement chat (iterative editing) | AI generation | L | ✅ | API route sends HTML context to OpenAI; works with configured key |

**Deliverable:** Complete template builder with AI-powered email generation

---

## Phase 4: Messaging
**Goal:** Broadcast messaging, scheduling, sequences, delivery analytics

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 4.1 | Twilio SMS integration | Twilio config, Contacts | M | ✅ | `deliveryService.sendSms()` calls real Twilio REST API; falls back to console stub when no keys |
| 4.2 | SendGrid email integration | SendGrid config, Templates | M | ✅ | `deliveryService.sendEmail()` calls real SendGrid v3 API; falls back to console stub |
| 4.3 | Create & send message (single) | SMS + Email integration | M | ✅ | Create Message tab with channel, content, scheduling |
| 4.4 | Audience targeting (all, categories) | Contacts, Categories | M | ✅ | `audienceService.resolveAudience()`, per-role and per-individual targeting |
| 4.5 | Message scheduling | Messaging, Firebase Functions | M | ✅ | Schedule UI + Firestore status + `processScheduledMessages` Firebase Function (every 1 min) |
| 4.6 | Multi-message sequences | Scheduling | L | ✅ | NotificationSequenceBuilder on events provides multi-step before/after sequences with channel, timing, audience, content |
| 4.7 | Sent message log + analytics | Messaging | M | ✅ | Sent tab with delivery analytics display |
| 4.8 | Scheduled message management (edit, cancel) | Scheduling | M | ✅ | Edit content/time, cancel scheduled messages |

**Deliverable:** Full broadcast messaging with scheduling and analytics

---

## Phase 5: Events
**Goal:** Event management with registration and notification sequences

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 5.1 | Event CRUD (create, edit, delete) | Event service | M | ✅ | Full-page create (`/admin/events/new`) and edit (`/admin/events/[id]/edit`) with recurrence + notifications |
| 5.2 | Event publish/unpublish | Events | S | ✅ | Toggle between draft/published |
| 5.3 | Public events listing page | Events | M | ✅ | `/events` page showing published events; admin has "View Events Live" button |
| 5.4 | Dealer registration flow (phone verification) | Events, Contacts | L | ✅ | `/events/[id]/register` — phone lookup → recognized (one-click) or new contact form |
| 5.5 | Notification sequence builder (drag & drop) | Events, Messaging | L | ✅ | `NotificationSequenceBuilder` with channel/timing/audience, reorder up/down, custom content |
| 5.6 | Recurring events | Events | M | ✅ | Recurrence pattern selector (none/weekly/biweekly/monthly/custom) with optional end date |
| 5.7 | Automated notification processing | Sequences, Functions | L | ✅ | `processEventNotifications` Firebase Function checks published events every 5 min, fires steps based on timing |

**Deliverable:** Complete event lifecycle with public registration

---

## Phase 6: Surveys
**Goal:** Port survey builder, response collection, analytics

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 6.1 | Port SurveyBuilder component | dnd-kit | L | ✅ | `survey-builder` component directory |
| 6.2 | Port QuestionEditor component | SurveyBuilder | M | ✅ | Integrated into survey builder |
| 6.3 | Survey CRUD (create, edit, delete) | Survey service | M | ✅ | Full CRUD + duplicate in surveys page |
| 6.4 | Public survey renderer (dealer-facing) | Survey service | M | ✅ | `/surveys` public route |
| 6.5 | Survey response collection | Renderer | M | ✅ | Response submission with tracking tokens |
| 6.6 | Survey analytics dashboard | Responses | M | ✅ | Question-by-question breakdown, choice counts, numeric averages |
| 6.7 | Attach surveys to messages/events | Messaging, Events | S | ✅ | "Attach Survey Link" dropdown in message composer inserts survey URL into SMS/email content |

**Deliverable:** Full survey system with analytics

---

## Phase 7: SMS Inbox & Suppression
**Goal:** Real-time SMS inbox, opt-out management

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 7.1 | Real-time SMS inbox (Firestore onSnapshot) | Twilio webhooks | M | ✅ | `smsInboxService` with `subscribeToConversations` + `subscribeToMessages` real-time listeners |
| 7.2 | Reply from inbox | SMS integration | M | ✅ | Reply UI calls `sendSms()` through real Twilio API (or stub fallback) |
| 7.3 | Contact SMS history view | Contacts, Inbox | S | ✅ | "SMS History" link in contact dropdown navigates to SMS Inbox filtered by phone |
| 7.4 | Suppression list page | Suppression service | M | ✅ | Full list with add/remove, channel filter |
| 7.5 | Twilio opt-out webhook processing | Webhooks | M | ✅ | `/api/webhooks/twilio` creates suppression records, updates contact/prospect `optOutSms`, creates inbox conversations |
| 7.6 | SendGrid unsubscribe webhook processing | Webhooks | M | ✅ | `/api/webhooks/sendgrid` processes unsubscribe/bounce events, updates `optOutEmail`, creates suppression entries |
| 7.7 | Auto-skip suppressed contacts in messaging | Suppression, Messaging | S | ✅ | `broadcastMessage()` checks `optOutSms` and `optOutEmail` flags before sending |

**Deliverable:** Real-time communications hub with compliance

---

## Phase 8: PD Recruitment — Core
**Goal:** Prospect management, playbook configuration

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 8.1 | Prospect list view (filterable, sortable) | Prospect service | M | ✅ | Search, filter by status/tags |
| 8.2 | Prospect profile page | Prospects | M | ✅ | Dedicated page at `/admin/prospects/[id]` with editable details, tag toggle, collected data, conversation history |
| 8.3 | Tagging system (status, phase, custom) | Prospects, Settings | M | ✅ | Full Prospect Tags CRUD in Settings > Prospect Tags tab; tags toggle on profile page |
| 8.4 | Playbook configuration UI | Playbook service | L | ✅ | Full CRUD for playbooks — add/edit/remove/reorder steps, set active playbook |
| 8.5 | "Become a Dealer" landing page | Public routes | M | ✅ | `/become-a-dealer` with form submission → prospect creation |
| 8.6 | Prospect webhook endpoint | Webhooks | M | ✅ | `/api/webhooks/prospects` route |

**Deliverable:** Prospect management with configurable playbooks

---

## Phase 9: PD Recruitment — AI Conversations
**Goal:** AI-driven qualification conversations, human handoff, copilot

| # | Feature | Dependencies | Effort | Status | Notes |
|---|---|---|---|---|---|
| 9.1 | AI auto-mode conversation engine | Playbook, OpenAI, Prospects | XL | ✅ | `/api/ai/conversation` route calls OpenAI Chat Completions with playbook context; falls back to canned responses |
| 9.2 | Real-time conversation thread view | Prospects, Firestore onSnapshot | M | ✅ | Three-panel layout with prospect list, message thread, and sidebar |
| 9.3 | Playbook step advancement logic | AI engine, Playbook | L | ✅ | Manual "Advance Step" button + auto-advance after every 3 prospect messages |
| 9.4 | Human handoff trigger + banner | Conversations | M | ✅ | "Ready for Human Handoff" banner displayed when status is 'qualified' or 'handed-off' |
| 9.5 | Auto/Human mode toggle | Conversations | S | ✅ | Toggle switch updates `conversationMode` on prospect |
| 9.6 | AI copilot sidebar (human mode) | Copilot skill, OpenAI | L | ✅ | Sidebar fetches AI suggestions from OpenAI in copilot mode; shows loading state; falls back to static tips |
| 9.7 | Recruitment-specific AI skills | Skills, Settings | M | ✅ | AI Skills system supports recruitment prompts; route uses matching skill prompts automatically |

**Deliverable:** Full AI-powered recruitment pipeline

---

## Effort Key

| Code | Meaning | Rough Hours |
|---|---|---|
| S | Small | 2–4 hrs |
| M | Medium | 4–8 hrs |
| L | Large | 8–16 hrs |
| XL | Extra Large | 16–32 hrs |

---

## Summary

| Phase | Total Items | ✅ Done | 🔶 Partial | ❌ Not Started |
|---|---|---|---|---|
| 1 — Core Foundation | 5 | 5 | 0 | 0 |
| 2 — Contact Management | 5 | 5 | 0 | 0 |
| 3 — Templates & Email Builder | 5 | 5 | 0 | 0 |
| 4 — Messaging | 8 | 8 | 0 | 0 |
| 5 — Events | 7 | 7 | 0 | 0 |
| 6 — Surveys | 7 | 7 | 0 | 0 |
| 7 — SMS Inbox & Suppression | 7 | 7 | 0 | 0 |
| 8 — PD Recruitment Core | 6 | 6 | 0 | 0 |
| 9 — AI Conversations | 7 | 7 | 0 | 0 |
| **TOTAL** | **57** | **57** | **0** | **0** |
