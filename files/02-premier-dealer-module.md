# Premier Dealer Portal — Premier Dealer Module

## Overview

The Premier Dealer module is the primary section of the app, focused on event planning, dealer communication, and engagement with existing Solatube premier dealers. It includes a public-facing frontend for dealers and a full admin backend for managing events, contacts, messaging, surveys, and more.

---

## Frontend (Dealer-Facing)

### Events Page

- Simple chronological list of upcoming **published** events
- Each event shows: title, description, date/time
- Dealers can register for events from this page

### Dealer Registration Flow

**Step 1: Phone Verification**

- Dealer enters their phone number
- System checks if the phone number exists in the contacts database

**Step 2a: Phone Found**

- Dealer is recognized and can proceed to register for the event
- On successful registration:
  - On-screen confirmation message displayed (no confirmation email/SMS for now)
  - Dealer is added to the event's attendee list with a registration timestamp
  - Dealer begins receiving any scheduled messages tied to that event

**Step 2b: Phone Not Found (Fallback Request)**

- Message displayed: "We don't have that number on file, but we'd love to add you"
- Form collects: name, email, and which dealer they're with
- Submission goes into a **pending approval queue** in the admin backend
- Admin reviews and approves or denies
- On approval: contact is created and **automatically registered** for the event they were trying to sign up for
- They then begin receiving scheduled messages for that event going forward

---

## Admin Backend — Sidebar Navigation

The following sections appear in the sidebar when the "Premier Dealers" top tab is active:

1. Contacts
2. Events
3. Messages
4. Templates
5. Surveys
6. SMS Inbox
7. Suppression List

---

## 1. Contacts (Dealer Management)

### Contact Record Fields

- Name
- Phone number
- Email
- Notes (free text, ability to add multiple notes)
- Category tags (one or more per contact)
- Opt-out status (email and/or SMS)
- SMS conversation history (full back-and-forth thread for that phone number)

### Features

- Add, edit, and delete contacts (both Admin and Manager roles)
- Assign one or more categories to each contact
- View full SMS conversation history per contact
- View opt-out status
- Add and view notes

### Pending Approval Queue

- List of dealer signup requests submitted from the frontend (fallback flow)
- Each request shows: name, email, dealer affiliation, and which event they were trying to register for
- Admin can approve (creates contact + auto-registers for event) or deny

### Contact Categories

- Created and managed in **Settings**
- Examples: "Premier Dealer," "Gold Tier," "West Region," etc.
- Used for audience targeting when sending messages

---

## 2. Events

### Event Creation

- **Title**
- **Description**
- **Date/Time** — calendar-based scheduling
- **Recurrence** — option to set recurring patterns (weekly, biweekly, monthly, first Tuesday of the month, etc.)
- **Status** — events are created as **Draft** by default (not visible on frontend). Must be explicitly **Published** to appear on the dealer-facing events page. Can be unpublished to return to draft.

### Event Detail View

- Registration log — list of who registered and when
- Attached surveys with response data and analytics
- Notification sequence builder (see below)

### Event Notification Sequence

A drag-and-drop or selectable sequence of messages tied to the event. Each message in the sequence is configured with:

- **Channel:** SMS, email, or both
- **Template:** Select from existing templates or build custom inline
- **Survey attachment:** Optionally attach a survey (embedded as a link in the message)
- **Timing:** Scheduled relative to the event time
  - Before the event (e.g., "3 days before," "1 hour before")
  - After the event (e.g., "1 day after," "1 week after")
- **Audience:** Per-message selection
  - "Registered for this event" — only people who registered
  - "All contacts" — entire contact list
  - Specific contact category

### Recurring Events

- Notification sequences carry over automatically to each occurrence
- Set up once, applies to all future instances

---

## 3. Messages (Broadcast Messaging)

### Sub-Navigation Tabs

- **Create Message** — compose and schedule new messages
- **Scheduled** — view and manage upcoming scheduled messages
- **Sent** — log of all sent messages with delivery analytics

### Create Message

- **Channel:** SMS, email, or both
- **Content:** Select from an existing template OR build a custom email inline using the GrapesJS editor
- **AI generation:** Describe what you want → select a skill → AI generates the email. Continue chatting with AI to refine. Can also switch to manual editing in GrapesJS and back.
- **Survey attachment:** Optionally attach a survey (embedded as a link)
- **Audience selection:** Choose target audience
  - All contacts
  - One or more contact categories
- **Schedule:** Send immediately or schedule for a specific date/time

### Multi-Message Sequences

- Button at top: "Schedule Multiple Messages"
- Build a string of related messages (e.g., initial announcement → 5-day reminder → day-of reminder)
- Each message in the sequence has its own:
  - Content (template or custom)
  - Scheduled send time
  - Channel (SMS, email, or both)
- Use case: rolling communications about an upcoming change or initiative

### Scheduled View

- List of all upcoming scheduled messages (single sends and sequences)
- Can go back to any scheduled message to:
  - Edit content
  - Change schedule time
  - Cancel

### Sent View

- Log of all sent messages
- Delivery analytics per message:
  - Delivery/receive rate for SMS
  - Delivery/receive rate for email
  - Broken out separately when both channels were used

---

## 4. Templates

### Email Templates

- **GrapesJS drag-and-drop editor** (open-source, installed as npm package)
  - Drag-and-drop components: text blocks, images, buttons, dividers, columns, etc.
  - Outputs email-safe HTML (table-based for cross-client compatibility)
  - Uses `grapesjs-preset-newsletter` plugin for email-specific blocks
- **AI generation:**
  - Select a skill (brand prompt) for style/tone guidance
  - Describe what you want in natural language
  - AI generates HTML → loads into GrapesJS editor
  - Continue chatting with AI to request changes (current HTML state is sent as context)
  - Freely switch between AI refinement and manual visual editing
- Templates are saved and reusable across events and broadcast messages

### SMS Templates

- Text-based editor (no drag-and-drop needed)
- **Live character counter:**
  - 0–160 characters: normal, single SMS message
  - At 160 characters: warning popup — "We've reached the limit for one SMS message. If you'd like to make the message longer you can, but just know that it may send in 2 messages." User acknowledges to continue.
  - 161–600 characters: allowed, with the understanding it may send as multiple SMS
  - At 600 characters: hard limit — no further input allowed. Message: "Sorry, you can't exceed 600 characters."
- Templates are saved and reusable

---

## 5. Surveys

### Survey Builder

Custom-built component (ported from existing project). No external survey library.

- **Left panel:** Question type palette — click to add a question
- **Right panel:** Survey canvas with title, description, and question list
- **Drag-and-drop reordering** of questions via `@dnd-kit`
- **Supported question types:**
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

### Survey Management

- Create, edit, and delete survey templates
- Survey status: draft, active, closed
- Attach surveys to event notification messages or broadcast messages (embedded as a link in SMS/email)

### Survey Analytics

- View survey results drilled down by event
- Dedicated surveys section showing all surveys with metrics
- Metrics include:
  - Response count
  - Completion rate
  - Question-by-question breakdown (aggregated counts, charts)
- Response data supports both anonymous and tracked (via tracking tokens) modes

---

## 6. SMS Inbox

### Real-Time Inbound SMS

- Displays all inbound SMS replies in real-time (no page refresh needed)
- Uses Firestore `onSnapshot` listeners
- Flow: Twilio webhook → Firebase Edge Function → writes to Firestore → frontend listener updates instantly

### Features

- View all inbound messages across all contacts
- Reply directly from the inbox
- Conversation threads grouped by phone number
- Individual contact SMS history also viewable from the contact detail page

---

## 7. Suppression List

### Dedicated Section

- List of all contacts who have opted out of email, SMS, or both
- Shows: contact name, phone/email, which channel(s) they opted out of, date of opt-out

### Opt-Out Triggers

**SMS:**
- Twilio handles standard opt-out keywords: STOP, UNSUBSCRIBE, QUIT, CANCEL, etc.
- Opt-out events sync back via Twilio webhook → Firebase Edge Function

**Email:**
- Standard unsubscribe link in all email footers (CAN-SPAM compliant)
- SendGrid handles unsubscribe → webhook → Firebase Edge Function

### Behavior

- Opted-out contacts are automatically excluded from all automated message sequences (event notifications and broadcast messaging)
- Opt-out status is flagged on the individual contact record ("Opted out of Email" / "Opted out of SMS")
- Suppression applies to both event-based and broadcast messaging
