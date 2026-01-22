# Karawan

Karawan is a fast, local **web UI for chatting with AI models running on your own machine**. It’s built to feel natural, responsive, and private, without depending on cloud services or external APIs.

Everything runs locally. Your conversations stay on your system.

With voice responses, Karawan feels closer to a conversation than a chat box.
---

## What Karawan Is

Karawan is a frontend UI. It does not run models by itself.

It connects to a **local AI backend** (such as Ollama, LM Studio, or any OpenAI-compatible local server) and provides a clean, focused interface for real conversations.

If you already run local models, Karawan is the layer that makes interacting with them easier on a network level, meaning you can access it from different devices in the network.

---

## Features

* Chat interface built specifically for local AI models
* Text-to-speech responses that feel close to a call-like experience
* Runs fully offline with no cloud dependency
* Optional UI language switching, including full Arabic support
* Fast startup and smooth interaction
* No tracking, no telemetry, no data collection
* Installed and run using npm

---

## Requirements

* Node.js v18 or newer
* npm
* A local AI backend accessible over HTTP

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

---

## Running Karawan

Start the development server:

```bash
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

Once running, open your browser and navigate to:

```
http://localhost:3000
```

The port may vary depending on your setup.

---

## Connecting to a Local Model

Karawan works with any local AI server that exposes an HTTP API.

You can configure:

* Backend URL
* For connecting to Ollama API, run ```ollama serve``` on your terminal, the app is already set to Ollama API port number by default.
* Model name or identifier

Configuration is handled through in-app settings.

---

## Tech Stack

* React
* TypeScript
* Vite
* npm

Karawan is backend-agnostic and does not lock you into a specific provider or model.

---

## Version & Status

Karawan currently beta, but is actively developed and evolving.

---

## Disclaimer

This project is intended for local and personal use. You are responsible for how models are run and how generated content is used.

---

## Contributing

Issues, pull requests, and thoughtful feedback are welcome.

If something feels off or can be improved, open an issue.



---

Karawan is made in Saudi Arabia, built for people who value control, privacy, and a more natural way to interact with local AI.

