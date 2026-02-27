# Premier Dealer Portal

Web application at `pd.solatube.tools` for managing premier dealer events, communication, and AI-powered dealer recruitment.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Firebase (Firestore, Auth, Storage, Edge Functions)
- **Integrations:** Twilio (SMS), SendGrid (Email), OpenAI (AI features)
- **Libraries:** GrapesJS (email builder), @dnd-kit (drag & drop)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your API keys in .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/           # Next.js App Router (public + admin routes)
├── components/    # UI components (shadcn, layout, email builder, surveys)
├── lib/           # Firebase config, services, AI, utilities
├── types/         # TypeScript type definitions
├── hooks/         # Custom React hooks
└── styles/        # Global styles
functions/         # Firebase Edge Functions
docs/              # Planning documents
files/             # Original spec documents
```

## Planning Docs

- [Firestore Schema](docs/firestore-schema.md)
- [API Routes & Functions](docs/api-routes.md)
- [Build Phases](docs/build-phases.md)
- [Component Map](docs/component-map.md)

## Modules

1. **Premier Dealers** — Events, contacts, messaging, surveys, SMS inbox
2. **PD Recruitment** — AI-powered prospect qualification, playbook-driven conversations
