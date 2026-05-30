<p align="center">
  <img src="docs/assets/logo-wordmark.svg" alt="Flowboard" width="480" />
</p>


---

### ☕ Sponsor this project

<table align="center">
  <tr>
    <td align="center" width="50%">
      <a href="docs/assets/sponsor-qr-vn.jpg">
        <img src="docs/assets/sponsor-qr-vn.jpg" alt="Vietnam QR — MoMo / VietQR / napas247" width="240" />
      </a><br/>
      <sub>📱 <b>Vietnam</b><br/>MoMo · VietQR · napas247</sub>
    </td>
    <td align="center" width="50%">
      <a href="docs/assets/sponsor-qr-binance.png">
        <img src="docs/assets/sponsor-qr-binance.png" alt="Binance Pay QR — Cris Ng" width="240" />
      </a><br/>
      <sub>💰 <b>Binance Pay</b><br/>Crypto / cross-border</sub>
    </td>
  </tr>
</table>

<p align="center">
  🌍 <b>International (card):</b>
  <a href="https://ko-fi.com/crisnguyen95">
    <img src="https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-FF5E5B?logo=kofi&logoColor=white" alt="Ko-fi" />
  </a>
</p>

<p align="center">
  <sub><i>(yes — I moved this up here on purpose. Was afraid nobody scrolls past the badges 😅)</i></sub>
</p>

---

<p align="center">
  <b>A local-only, single-user infinite-canvas workspace for AI media workflows and automated publishing.</b><br/>
  Compose characters, products, scenes, and videos as a directed graph. Generate visual assets through a Chrome extension proxying requests to Google Flow (Veo 3.1 / GEM_PIX_2). <br/>
  Auto-post or schedule generated creatives directly to social media networks (Facebook, TikTok, YouTube, Instagram) using integrated publishing pipelines.
</p>

> **⚠ Hard requirements — read this before cloning:**
>
> 1. **Google Flow plan: `Pro` or `Ultra` only.** Veo 3.1 i2v + GEM_PIX_2 are gated to paid tiers. Confirm your plan at [labs.google/fx](https://labs.google/fx/tools/flow) before installing.
> 2. **Chrome extension is mandatory.** All generation requests are proxied through `extension/` (Chrome MV3) so the agent can use your authenticated Flow session + reCAPTCHA token.
> 3. **One LLM CLI on `PATH` for auto-prompt / vision / planner.** Flowboard ships a swappable provider layer:
>    - **Claude Code** (default, recommended) — `@anthropic-ai/claude-code`
>    - **Gemini CLI** — `@google/gemini-cli`
>    - **OpenAI Codex** — `@openai/codex` (Beta)

<p align="center">
  <a href="#why">Why</a> ·
  <a href="#demo">Demo</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#quickstart">Quickstart</a> ·
  <a href="#features">Features</a> ·
  <a href="skill.md">Technical Skills</a>
</p>

---

## Demo

<p align="center">
  <a href="docs/assets/flowboard-intro.mp4">
    <img src="docs/assets/flowboard-intro.gif" alt="Flowboard end-to-end walkthrough" width="720" />
  </a><br/>
  <sub>End-to-end walkthrough — refs → composed image → multi-source i2v. Click for full-quality MP4.</sub>
</p>

---

## Why

E-commerce video creative is repetitive: same model, same product, many scenes, many short clips. Building it by hand in a generic Veo / Imagen UI means re-uploading character refs, re-typing prompts, and losing track of variant assets.

Flowboard treats this workflow as a graph:
- **Refs are nodes**: Upload a character or product once.
- **Composed shots are nodes**: Connect character + product to generate multi-pose scene images.
- **Videos are nodes**: Connect composed images to trigger Image-to-Video batches.
- **Social Blocks are nodes**: Select target channels, write or auto-generate captions, and instantly post or schedule posts with all connected media attached.

---

## How It Works

```mermaid
graph LR
    A[#op4v Visual asset<br/>Garment Ref]:::ref --> C[#qowj Composed Image<br/>Studio Shot]
    B[#0p1u Character<br/>Model Ref]:::ref --> C
    C --> D[#nkov Autumn Image<br/>Scene Variant]
    D --> E[#bwr4 Video<br/>Veo 3.1 motion]:::video
    E --> F[#8gc6 Social Block<br/>Auto-post / Schedule]:::social

    classDef ref fill:#1d4d2e,stroke:#5db97a,color:#fff;
    classDef video fill:#2b1d4d,stroke:#7c5cff,color:#fff;
    classDef social fill:#1e3a8a,stroke:#3b82f6,color:#fff;
```

### 1. Visual Generation
- **Character Nodes**: Store portrait headshots to keep facial identity consistent.
- **Visual Asset Nodes**: Store product and garment references.
- **Image Nodes**: Pull upstream refs to generate custom editorial photos.
- **Storyboard Nodes**: Sequence 1–8 narrative shots with BFS dependency execution.
- **Video Nodes**: Trigger Veo 3.1 i2v motion rendering.

### 2. Auto-Prompt & Vision
The vision agent describes uploaded assets (`aiBrief`). When generating downstream nodes with empty prompts, the system compiles upstream briefs, detects scene contexts (e.g., street vs. studio), and designs tailored prompts and time-coded motion cues automatically.

### 3. Direct Posting & Scheduling (Social Blocks)
- Wire any generated Image/Video node to a **Social Block** node.
- Choose platforms (Facebook, TikTok, YouTube, Instagram).
- Write a caption (or click **Generate AI** to synthesize one based on connected visuals).
- **🚀 Đăng nhanh (Auto)**: Instantly uploads connected images/videos to social platforms (e.g., via Facebook Graph API as unpublished gallery media) and publishes the post.
- **📅 Schedule**: Specify Date/Time to queue posts in SQLite. The FastAPI background scheduler checks for due items every 60 seconds and auto-publishes them.

---

## Architecture

```
┌──────────────────────┐    ┌────────────────────┐    ┌──────────────────────┐
│  Chrome MV3 ext      │◄───┤  FastAPI agent     ├───►│  SQLite (storage/)   │
│  - content script    │ WS │  127.0.0.1:8101    │    │  Board, Node, Edge,  │
│  - injected MAIN     │ ws │  + worker queue    │    │  Request, Asset,     │
│  - Captcha bridge    │9223│  + WS server :9223 │    │  SocialBlockPost...  │
└──────────────────────┘    └─────────┬──────────┘    └──────────────────────┘
                                      │
                                      ▼
                            ┌────────────────────┐
                            │  React + Vite      │
                            │  ReactFlow canvas  │
                            └────────────────────┘
```

- **Frontend**: Vite + React 18 + ReactFlow 12 + Zustand 5. Infinite canvas interface.
- **Backend Agent**: FastAPI + SQLModel + SQLite. Hosts API routes, execution workers, background scheduler, and the local file cache.
- **Extension**: Intercepts Flow network calls to proxy credentials to local WebSockets securely.

---

## Quickstart

### Prerequisites
- **Python 3.11** and **Node.js 20+**
- **Chrome browser** (Developer Mode enabled)
- **Google Flow Pro/Ultra account**
- **One LLM CLI** on `PATH` (e.g., Claude Code, Gemini CLI, or OpenAI Codex)

### Setup Commands
We provide a simple Makefile for easy installation:
```bash
make install        # Install virtual environment and frontend deps
make agent          # Start FastAPI agent on port 8101
make frontend       # Start Vite dev server on port 1234
```

1. Load `extension/` unpacked in Chrome (`chrome://extensions/`).
2. Log into [labs.google/fx/tools/flow](https://labs.google/fx/tools/flow).
3. Open `http://localhost:1234` to start composing on the canvas.

For testing:
```bash
cd agent && .venv/bin/python -m pytest -q    # Runs 333 backend tests
```

---

## Features

- **Character & Visual Asset Management**: Hard-anchored references for consistent outputs.
- **Multi-Reference Composition**: Splicing model refs and garment refs into environment-aware scenes.
- **Multi-Source Video Synthesis**: One-click generation of multiple motion clips from different image variants.
- **Storyboard Pipelines**: Narrative workflows executing scene continuations and retries.
- **Social Block Publishing Engine**: 
  - Auto-generation of platform-specific captions.
  - Multi-media uploading support.
  - Background cron worker for precise date/time scheduling.
- **Ergonomic Canvas Tools**: Quick-add menus, easy edge deletion, activity logging dropdown, and multi-board setups.

---

## License

MIT License.
