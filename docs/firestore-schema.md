# Firestore Schema — Premier Dealer Portal

Detailed collection and document schemas for all Firestore collections used by the app.

---

## `contacts`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Full name |
| `phone` | `string` | Phone number (E.164 format) |
| `email` | `string` | Email address |
| `notes` | `array<Note>` | Array of note objects |
| `categories` | `array<string>` | Category tag IDs |
| `optOutEmail` | `boolean` | Email opt-out flag |
| `optOutSms` | `boolean` | SMS opt-out flag |
| `createdAt` | `timestamp` | Record creation time |
| `updatedAt` | `timestamp` | Last update time |

**Subcollection: `Note` (embedded in array)**

| Field | Type |
|---|---|
| `id` | `string` |
| `content` | `string` |
| `createdAt` | `timestamp` |
| `createdBy` | `string` (user ID) |

---

## `events`

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Event title |
| `description` | `string` | Event description |
| `dateTime` | `timestamp` | Event date/time |
| `recurrence` | `string` | `none` \| `weekly` \| `biweekly` \| `monthly` \| `custom` |
| `recurrenceConfig` | `map` | Optional: `{ interval, dayOfWeek, weekOfMonth, endDate }` |
| `status` | `string` | `draft` \| `published` |
| `notificationSequence` | `array<NotificationStep>` | Ordered notification steps |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |
| `createdBy` | `string` | User ID |

### Subcollection: `events/{eventId}/registrations`

| Field | Type |
|---|---|
| `contactId` | `string` |
| `contactName` | `string` |
| `registeredAt` | `timestamp` |

### Subcollection: `events/{eventId}/surveys`

References survey documents attached to this event.

### Subcollection: `events/{eventId}/surveyResponses`

| Field | Type |
|---|---|
| `surveyId` | `string` |
| `trackingToken` | `string` (optional) |
| `answers` | `map` (questionId → value) |
| `submittedAt` | `timestamp` |
| `contactId` | `string` (optional) |

---

## `messages`

| Field | Type | Description |
|---|---|---|
| `channel` | `string` | `sms` \| `email` \| `both` |
| `status` | `string` | `draft` \| `scheduled` \| `sent` \| `failed` |
| `subject` | `string` | Email subject (optional) |
| `smsContent` | `string` | SMS body (optional) |
| `emailHtml` | `string` | Email HTML body (optional) |
| `templateId` | `string` | Template reference (optional) |
| `surveyId` | `string` | Attached survey (optional) |
| `audience` | `map` | `{ type, categoryIds[], eventId }` |
| `scheduledAt` | `timestamp` | When to send (optional) |
| `sentAt` | `timestamp` | When actually sent (optional) |
| `sequenceId` | `string` | Sequence group (optional) |
| `sequenceOrder` | `number` | Order in sequence (optional) |
| `analytics` | `map` | `{ smsDelivered, smsTotal, emailDelivered, emailTotal, emailOpened }` |
| `createdAt` | `timestamp` | |
| `createdBy` | `string` | |

---

## `templates`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Template name |
| `type` | `string` | `email` \| `sms` |
| `subject` | `string` | Email subject (optional) |
| `smsContent` | `string` | SMS text (optional) |
| `emailHtml` | `string` | Rendered HTML (optional) |
| `emailJson` | `string` | GrapesJS project JSON for re-editing (optional) |
| `skillId` | `string` | AI skill used to generate (optional) |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |
| `createdBy` | `string` | |

---

## `surveys`

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Survey title |
| `description` | `string` | Survey description |
| `status` | `string` | `draft` \| `active` \| `closed` |
| `questions` | `array<SurveyQuestion>` | Ordered question objects |
| `eventId` | `string` | Tied event (optional) |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |
| `createdBy` | `string` | |

**SurveyQuestion (embedded)**

| Field | Type |
|---|---|
| `id` | `string` |
| `type` | `string` (see QuestionType enum) |
| `text` | `string` |
| `required` | `boolean` |
| `options` | `array<string>` (optional) |
| `scaleMin` | `number` (optional) |
| `scaleMax` | `number` (optional) |
| `scaleLabels` | `array<string>` (optional) |
| `order` | `number` |

---

## `suppression`

| Field | Type | Description |
|---|---|---|
| `contactOrProspectId` | `string` | Reference to contact or prospect |
| `type` | `string` | `contact` \| `prospect` |
| `channel` | `string` | `email` \| `sms` |
| `identifier` | `string` | Phone or email that opted out |
| `optedOutAt` | `timestamp` | |
| `source` | `string` | `twilio` \| `sendgrid` \| `manual` |

---

## `prospects`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | |
| `phone` | `string` | |
| `email` | `string` | |
| `businessType` | `string` | Optional description |
| `currentPlaybookStep` | `number` | Current step index |
| `qualificationStatus` | `string` | `new` \| `in-progress` \| `qualified` \| `not-a-fit` \| `handed-off` \| `converted` |
| `conversationMode` | `string` | `auto` \| `human` |
| `tags` | `array<string>` | Status, phase, and custom tags |
| `collectedData` | `map` | Key-value data gathered by AI |
| `optOutEmail` | `boolean` | |
| `optOutSms` | `boolean` | |
| `createdAt` | `timestamp` | |
| `lastActivityAt` | `timestamp` | |

### Subcollection: `prospects/{prospectId}/conversations`

| Field | Type |
|---|---|
| `sender` | `string` (`ai` \| `human` \| `prospect`) |
| `channel` | `string` (`sms` \| `email`) |
| `content` | `string` |
| `timestamp` | `timestamp` |
| `playbookStep` | `number` (optional) |

---

## `playbooks`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Playbook name |
| `steps` | `array<PlaybookStep>` | Ordered step configs |
| `isActive` | `boolean` | Currently active playbook |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

**PlaybookStep (embedded)**

| Field | Type |
|---|---|
| `id` | `string` |
| `order` | `number` |
| `name` | `string` |
| `goal` | `string` |
| `infoToCollect` | `array<string>` |
| `aiInstructions` | `string` |
| `advancementCriteria` | `string` |
| `disqualificationCriteria` | `string` (optional) |

---

## `skills`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Skill name |
| `description` | `string` | |
| `colorPalette` | `array<string>` | Hex colors (optional) |
| `toneOfVoice` | `string` | (optional) |
| `layoutPreferences` | `string` | (optional) |
| `referenceImages` | `array<string>` | Storage URLs (optional) |
| `prompt` | `string` | Full AI prompt |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

---

## `users`

| Field | Type | Description |
|---|---|---|
| `email` | `string` | |
| `displayName` | `string` | |
| `role` | `string` | `admin` \| `manager` |
| `createdAt` | `timestamp` | |
| `lastLoginAt` | `timestamp` (optional) | |

---

## `logs`

| Field | Type | Description |
|---|---|---|
| `action` | `string` | See LogAction type |
| `description` | `string` | Human-readable description |
| `userId` | `string` | |
| `userName` | `string` | |
| `metadata` | `map` | Additional context (optional) |
| `createdAt` | `timestamp` | |

---

## `pendingRequests`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Requester name |
| `email` | `string` | |
| `dealerAffiliation` | `string` | Which dealer they're with |
| `eventId` | `string` | Event they were trying to register for |
| `status` | `string` | `pending` \| `approved` \| `denied` |
| `submittedAt` | `timestamp` | |
| `reviewedAt` | `timestamp` (optional) | |
| `reviewedBy` | `string` (optional) | |
