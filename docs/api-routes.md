# API Routes & Edge Functions — Premier Dealer Portal

All API routes (Next.js route handlers) and Firebase Edge Functions.

---

## Next.js API Routes (`src/app/api/`)

### Webhooks

| Route | Method | Purpose |
|---|---|---|
| `/api/webhooks/twilio/inbound` | POST | Receive inbound SMS from Twilio |
| `/api/webhooks/twilio/status` | POST | Twilio message delivery status callbacks |
| `/api/webhooks/twilio/optout` | POST | Twilio opt-out event (STOP, UNSUBSCRIBE) |
| `/api/webhooks/sendgrid/events` | POST | SendGrid delivery/open/unsubscribe events |
| `/api/webhooks/prospect` | POST | External form submissions → create prospect + trigger playbook |

### AI Endpoints

| Route | Method | Purpose |
|---|---|---|
| `/api/ai/generate-email` | POST | Generate email HTML using OpenAI + skill prompt |
| `/api/ai/refine-email` | POST | Refine existing email HTML via chat interaction |
| `/api/ai/recruitment-respond` | POST | Process prospect reply → generate AI response |
| `/api/ai/copilot-suggest` | POST | Generate suggested message for human operator |

### Messaging

| Route | Method | Purpose |
|---|---|---|
| `/api/messages/send-sms` | POST | Send SMS via Twilio |
| `/api/messages/send-email` | POST | Send email via SendGrid |
| `/api/messages/send-scheduled` | POST | Process and send a scheduled message (called by cron/scheduler) |

### Public

| Route | Method | Purpose |
|---|---|---|
| `/api/register` | POST | Public event registration (phone verification + registration) |
| `/api/signup-request` | POST | Pending dealer signup request (unknown phone) |

---

## Firebase Edge Functions (`functions/src/`)

### Scheduled Functions

| Function | Trigger | Purpose |
|---|---|---|
| `processScheduledMessages` | Pub/Sub cron (every 1 min) | Check for messages due to send, trigger send |
| `processNotificationSequences` | Pub/Sub cron (every 5 min) | Check event notification sequences, trigger due messages |

### Webhook Handlers (alternative to Next.js API routes)

If preferred, webhook endpoints can be implemented as Firebase Functions instead of Next.js API routes for independent scaling:

| Function | Trigger | Purpose |
|---|---|---|
| `twilioInboundWebhook` | HTTPS | Process inbound SMS |
| `twilioOptOutWebhook` | HTTPS | Process opt-out events |
| `sendgridEventWebhook` | HTTPS | Process email events |

### AI Processing

| Function | Trigger | Purpose |
|---|---|---|
| `processProspectReply` | Firestore trigger (on new conversation message) | Auto-mode: AI processes reply and generates response |
| `advancePlaybookStep` | Firestore trigger (on prospect data update) | Check if advancement criteria met, advance step |

---

## Request/Response Shapes

### POST `/api/ai/generate-email`

**Request:**
```json
{
  "prompt": "Create a welcome email for new premier dealers",
  "skillId": "skill-123",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "html": "<table>...</table>",
  "conversationHistory": [
    { "role": "user", "content": "Create a welcome email..." },
    { "role": "assistant", "content": "<table>...</table>" }
  ]
}
```

### POST `/api/webhooks/prospect`

**Request:**
```json
{
  "name": "John Smith",
  "phone": "+15551234567",
  "email": "john@example.com",
  "businessType": "Solar installation company"
}
```

**Response:**
```json
{
  "success": true,
  "prospectId": "prospect-abc123"
}
```

### POST `/api/register`

**Request:**
```json
{
  "phone": "+15551234567",
  "eventId": "event-xyz"
}
```

**Response (found):**
```json
{
  "found": true,
  "contactName": "Jane Doe",
  "registrationId": "reg-123"
}
```

**Response (not found):**
```json
{
  "found": false,
  "message": "Phone number not recognized"
}
```
