# Premier Dealer Portal — PD Recruitment Module

## Overview

The PD Recruitment module is the second major section of the app, focused on automating the qualification and outreach process for prospective Solatube premier dealers. It uses AI-powered conversations to engage, qualify, and nurture prospects before handing off qualified leads to a human operator.

---

## Frontend (Prospect-Facing)

### Landing Page

- **URL:** `pd.solatube.tools/become-a-dealer` (or similar)
- **Purpose:** MVP landing page for prospective dealers to express interest
- **Content:** "Become a Solatube Premier Dealer" headline with basic information (placeholder content for now — to be expanded later)
- **Form fields:**
  - Name
  - Phone number
  - Email
  - What kind of business they have (optional — it's okay if they don't have one yet)
- **On submit:**
  - Prospect profile is created in the backend
  - AI qualification playbook is kicked off automatically
  - Confirmation message displayed on screen

### Future: External Landing Pages + Webhooks

- Down the road, external landing pages (WordPress, standalone tools, etc.) can send form data to the app via webhooks
- Webhooks hit a Firebase Edge Function endpoint that creates the prospect profile and triggers the playbook
- The built-in landing page serves as the MVP demo of this flow

---

## Admin Backend — Sidebar Navigation

The following sections appear in the sidebar when the "PD Recruitment" top tab is active:

1. Prospects
2. Playbook Configuration
3. Conversations

**Settings** appears at the bottom of the sidebar (shared across both modules).

---

## 1. Prospects

### Prospect Profile Fields

- Name
- Phone number
- Email
- Business type / description (from initial form)
- Current playbook step
- Qualification status
- Tags
- Conversation history (full thread — AI and human messages)
- All collected data points (populated as the AI gathers information)
- Date created
- Date of last activity

### Prospect List View

- List of all prospects with key info at a glance
- Filterable and sortable by:
  - Tags (status, phase, custom)
  - Qualification status
  - Playbook step
  - Date created
  - Last activity

### Tagging System

Prospects can be tagged with multiple tags across these categories:

**Status Tags:**
- In Progress
- Qualified
- Not a Fit
- Handed Off (to human)
- Converted (became a premier dealer)

**Phase Tags:**
- Reflect the current playbook step (e.g., "Initial Contact," "Business Background," "Experience Check," "Ready for Handoff")
- Automatically updated as the AI progresses through the playbook

**Custom Tags:**
- Ability to create and assign any additional tags as needed
- Managed in Settings

---

## 2. Playbook Configuration

### Overview

The qualification playbook is a **step-by-step configuration stored in Firestore** (not hardcoded). Each step defines what the AI should accomplish during that phase of the conversation.

### Playbook Step Structure

Each step includes:

- **Step name** — e.g., "Initial Contact," "Business Background"
- **Goal** — what the AI is trying to accomplish in this step (natural language description)
- **Information to collect** — specific data points to gather (e.g., service territory, years in business, number of employees)
- **AI instructions** — guidance for tone, approach, and conversation style for this step
- **Advancement criteria** — conditions that must be met to move to the next step (e.g., "all three data points collected")
- **Disqualification criteria** — conditions that would mark the prospect as "Not a Fit" (optional per step)

### Example Playbook

**Step 1: Initial Contact**
- Goal: Introduce, thank for interest, ask about service area
- Collect: Service territory / location
- Advance when: Location captured

**Step 2: Business Background**
- Goal: Learn about their business
- Collect: How long in business, number of employees, types of work they do
- Advance when: All three data points captured

**Step 3: Experience Check**
- Goal: Assess relevant industry experience
- Collect: Experience with skylights/daylighting, current product lines they carry
- Advance when: Experience info captured

**Step 4: Qualification Decision**
- If criteria met (right territory, enough experience, established business) → tag as "Qualified," flag for human handoff
- If criteria not met → tag as "Not a Fit," send polite message with alternative resources

### Admin UI

- View and edit all playbook steps from the admin interface
- Add, remove, and reorder steps
- Edit step details (goal, info to collect, criteria) without touching code
- Changes take effect for new conversations (in-progress conversations continue on the playbook version they started with)

---

## 3. Conversations

### AI Conversation Flow

**How it works:**

1. Prospect submits form → profile created → playbook starts at Step 1
2. AI sends initial message (SMS and/or email) based on Step 1's goal and instructions
3. Prospect replies → AI processes the response, extracts relevant data, saves to profile
4. AI continues the conversation, working through the current step's goals
5. When advancement criteria are met → AI moves to the next step
6. Process continues until qualification decision is reached

**At each message, the AI receives:**
- The selected skill/prompt for tone and style
- The current playbook step (goal, info to collect, instructions)
- The full conversation history
- All data collected so far on the prospect's profile

This allows the AI to have natural, contextual conversations while staying on track with the qualification process. It can handle:
- Partial answers
- Off-topic questions from the prospect
- Prospects who ask their own questions
- Unusual responses

### Conversation Detail View

Each prospect has a conversation thread in the admin that shows:

- Full message history (AI messages and prospect replies)
- Which channel each message was sent on (SMS/email)
- Timestamps
- Current playbook step indicator
- Visual notification/banner when "Ready for Human Handoff" is triggered
- All collected data points displayed alongside the conversation

### Human Handoff

**Trigger:** When the AI determines a prospect is qualified (meets Step 4 criteria or equivalent), a visual indicator appears in the conversation thread — a banner or badge saying "Ready for Human Handoff."

**Transition:**
- The conversation continues in the same thread — no separate chat
- The human operator can see the full history of AI messages
- A toggle switches the conversation from **Auto Mode** to **Human Mode**

### Two AI Modes

**Auto Mode (AI-driven):**
- AI sends and receives messages automatically in real-time
- AI follows the playbook steps
- No human intervention needed
- Both SMS and email channels

**Human Mode (AI as copilot):**
- AI **stops auto-sending** messages to the prospect
- AI shifts to a **sidebar assistant** role:
  - Can draft suggested messages for the human to review
  - Can answer the human's questions about the prospect, product info, program details, etc.
  - Can provide context and recommendations
- Human reviews, edits if needed, and manually hits send
- A dedicated **skill/prompt in Settings** defines the AI's behavior in this copilot role (what it can answer, tone, boundaries)

### Real-Time Updates

- Conversation threads update in real-time using Firestore `onSnapshot` listeners
- New inbound messages from prospects appear instantly without refreshing
- AI responses are also reflected in real-time as they're generated and sent

---

## Opt-Out / Suppression Handling

The same opt-out handling from the Premier Dealer module applies to the recruitment side:

**SMS:**
- Standard opt-out keywords (STOP, UNSUBSCRIBE, QUIT, CANCEL, etc.) handled by Twilio
- Synced back to the app — prospect record flagged, added to suppression list
- AI stops messaging that prospect

**Email:**
- Unsubscribe link in all emails
- SendGrid handles unsubscribe events → webhook → updates prospect record + suppression list
- AI stops emailing that prospect

---

## Webhook Integration

### Built-In Landing Page

- Form submission creates a prospect profile directly in Firestore
- Triggers playbook automatically

### External Webhooks (Future)

- Firebase Edge Function endpoint: `pd.solatube.tools/api/webhooks/prospect` (or similar)
- Accepts POST requests with prospect data (name, phone, email, business info)
- Creates prospect profile and triggers playbook
- Can be connected to any external form tool, landing page builder, or CRM

---

## Settings (Recruitment-Specific)

These settings are managed in the shared Settings section but apply to the recruitment module:

### AI Skills for Recruitment

- **Recruitment Auto Mode Skill** — defines the AI's personality, tone, and behavior when driving automated conversations with prospects
- **Recruitment Copilot Skill** — defines what the AI can help with when assisting a human operator (product knowledge, program details, suggested responses, boundaries)
- Both are configurable in the Skills section of Settings

### Prospect Tags

- Custom tags for prospect categorization are created and managed in Settings
- Status tags (In Progress, Qualified, Not a Fit, etc.) are system defaults but can be extended

### Playbook Access

- Playbook configuration is accessible from the recruitment sidebar
- Only Admins can modify the playbook structure (Managers can view but not edit — TBD based on preference)
