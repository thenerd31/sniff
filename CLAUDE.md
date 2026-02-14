# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sentinel is a visual investigation board that exposes online scams and finds legitimate deals — a detective's cork board powered by AI agents. It uses React Flow for a node-based canvas where evidence cards fly in with animations, connected by red strings, with a threat meter visualization.

The backend is the primary development focus. The agent pipeline uses OpenAI Responses API for orchestration with custom tools (WHOIS, SSL analysis, Safe Browsing, ScamAdviser, web scraping, Reddit search).

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- No test runner is configured yet

## Architecture

- **Framework:** Next.js 16 with App Router, React 19, TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 with class-variance-authority, tailwind-merge, clsx
- **UI Components:** Radix UI primitives (Dialog, Tooltip, Slot)
- **Visualization:** React Flow (investigation board canvas with custom nodes)
- **Animation:** Framer Motion (card fly-in, threat meter pulse)
- **State:** Zustand
- **Validation:** Zod
- **AI:** OpenAI SDK for agent pipeline
- **React Compiler** is enabled in next.config.ts

Path alias `@/*` maps to `./src/*`.

### Backend Structure (Yifan's domain)

- `src/types/index.ts` — Shared type contract (EvidenceCard, SSEEvent, request/response types)
- `src/app/api/investigate/route.ts` — POST, accepts `{ url }`, streams SSE events
- `src/app/api/deepen/route.ts` — POST, accepts `{ investigationId, focus }`, streams SSE events
- `src/app/api/compare/route.ts` — POST, accepts `{ productUrl }`, streams SSE events
- `src/lib/agent.ts` — Agent orchestration (OpenAI Responses API + tool execution loop)
- `src/lib/tools/` — Tool implementations (whois, ssl, safe-browsing, scraper, reddit, scamadviser)
- `src/lib/tools/index.ts` — Tool registry (OpenAI function definitions + executor map)

### SSE Streaming Pattern

All API routes stream Server-Sent Events with typed events: `card`, `connection`, `threat_score`, `narration`, `done`, `error`.

## Key Technical Decisions

- Next.js API routes for backend (single deploy to Vercel)
- Heavy scraping/analysis offloaded to Python scripts on Modal
- OpenAI Responses API with function calling for agent orchestration
- Structured output for evidence cards with color-coded threat levels
