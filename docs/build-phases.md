# Build Phases — Premier Dealer Portal

Phased build order from foundational to advanced features. Each phase builds on the previous one.

---

## Phase 1: Core Foundation
**Goal:** Authentication, layout, navigation, basic CRUD infrastructure

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 1.1 | Firebase Auth integration (login/logout) | Firebase config | S |
| 1.2 | Admin layout (two-tab nav + sidebar) | Auth | M |
| 1.3 | User management (invite, roles, list) | Auth, Firestore | M |
| 1.4 | Settings page shell (API connections) | Layout | S |
| 1.5 | Activity logging infrastructure | Firestore | S |

**Deliverable:** Authenticated admin dashboard with navigation skeleton

---

## Phase 2: Contact Management
**Goal:** Full contact CRUD with categories and notes

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 2.1 | Contact list view (sortable, filterable) | Layout | M |
| 2.2 | Contact CRUD (add, edit, delete) | Contact service | M |
| 2.3 | Contact categories (manage in Settings) | Settings | S |
| 2.4 | Notes system (add/view notes per contact) | Contact CRUD | S |
| 2.5 | Pending approval queue (dealer signups) | Contact CRUD | M |

**Deliverable:** Fully functional contact management with categories

---

## Phase 3: Templates & Email Builder
**Goal:** GrapesJS email builder + SMS templates with AI generation

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 3.1 | SMS template editor (with char counter) | Template service | M |
| 3.2 | GrapesJS email editor integration | Template service | L |
| 3.3 | AI Skills management (Settings) | OpenAI config | M |
| 3.4 | AI email generation (prompt → HTML → GrapesJS) | Skills, GrapesJS | L |
| 3.5 | AI refinement chat (iterative editing) | AI generation | L |

**Deliverable:** Complete template builder with AI-powered email generation

---

## Phase 4: Messaging
**Goal:** Broadcast messaging, scheduling, sequences, delivery analytics

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 4.1 | Twilio SMS integration | Twilio config, Contacts | M |
| 4.2 | SendGrid email integration | SendGrid config, Templates | M |
| 4.3 | Create & send message (single) | SMS + Email integration | M |
| 4.4 | Audience targeting (all, categories) | Contacts, Categories | M |
| 4.5 | Message scheduling | Messaging, Firebase Functions | M |
| 4.6 | Multi-message sequences | Scheduling | L |
| 4.7 | Sent message log + analytics | Messaging | M |
| 4.8 | Scheduled message management (edit, cancel) | Scheduling | M |

**Deliverable:** Full broadcast messaging with scheduling and analytics

---

## Phase 5: Events
**Goal:** Event management with registration and notification sequences

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 5.1 | Event CRUD (create, edit, delete) | Event service | M |
| 5.2 | Event publish/unpublish | Events | S |
| 5.3 | Public events listing page | Events | M |
| 5.4 | Dealer registration flow (phone verification) | Events, Contacts | L |
| 5.5 | Notification sequence builder (drag & drop) | Events, Messaging | L |
| 5.6 | Recurring events | Events | M |
| 5.7 | Automated notification processing | Sequences, Functions | L |

**Deliverable:** Complete event lifecycle with public registration

---

## Phase 6: Surveys
**Goal:** Port survey builder, response collection, analytics

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 6.1 | Port SurveyBuilder component | dnd-kit | L |
| 6.2 | Port QuestionEditor component | SurveyBuilder | M |
| 6.3 | Survey CRUD (create, edit, delete) | Survey service | M |
| 6.4 | Public survey renderer (dealer-facing) | Survey service | M |
| 6.5 | Survey response collection | Renderer | M |
| 6.6 | Survey analytics dashboard | Responses | M |
| 6.7 | Attach surveys to messages/events | Messaging, Events | S |

**Deliverable:** Full survey system with analytics

---

## Phase 7: SMS Inbox & Suppression
**Goal:** Real-time SMS inbox, opt-out management

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 7.1 | Real-time SMS inbox (Firestore onSnapshot) | Twilio webhooks | M |
| 7.2 | Reply from inbox | SMS integration | M |
| 7.3 | Contact SMS history view | Contacts, Inbox | S |
| 7.4 | Suppression list page | Suppression service | M |
| 7.5 | Twilio opt-out webhook processing | Webhooks | M |
| 7.6 | SendGrid unsubscribe webhook processing | Webhooks | M |
| 7.7 | Auto-skip suppressed contacts in messaging | Suppression, Messaging | S |

**Deliverable:** Real-time communications hub with compliance

---

## Phase 8: PD Recruitment — Core
**Goal:** Prospect management, playbook configuration

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 8.1 | Prospect list view (filterable, sortable) | Prospect service | M |
| 8.2 | Prospect profile page | Prospects | M |
| 8.3 | Tagging system (status, phase, custom) | Prospects, Settings | M |
| 8.4 | Playbook configuration UI | Playbook service | L |
| 8.5 | "Become a Dealer" landing page | Public routes | M |
| 8.6 | Prospect webhook endpoint | Webhooks | M |

**Deliverable:** Prospect management with configurable playbooks

---

## Phase 9: PD Recruitment — AI Conversations
**Goal:** AI-driven qualification conversations, human handoff, copilot

| # | Feature | Dependencies | Effort |
|---|---|---|---|
| 9.1 | AI auto-mode conversation engine | Playbook, OpenAI, Prospects | XL |
| 9.2 | Real-time conversation thread view | Prospects, Firestore onSnapshot | M |
| 9.3 | Playbook step advancement logic | AI engine, Playbook | L |
| 9.4 | Human handoff trigger + banner | Conversations | M |
| 9.5 | Auto/Human mode toggle | Conversations | S |
| 9.6 | AI copilot sidebar (human mode) | Copilot skill, OpenAI | L |
| 9.7 | Recruitment-specific AI skills | Skills, Settings | M |

**Deliverable:** Full AI-powered recruitment pipeline

---

## Effort Key

| Code | Meaning | Rough Hours |
|---|---|---|
| S | Small | 2–4 hrs |
| M | Medium | 4–8 hrs |
| L | Large | 8–16 hrs |
| XL | Extra Large | 16–32 hrs |
