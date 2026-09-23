# TODO AI Workspace

## What it does
The app is a responsive TODO AI chat workspace inspired by the `todo-ai` feature in the Lagma Village repository. It provides a focused AI chat surface, prompt suggestions, quick AI tool shortcuts, new-chat reset, theme toggle and responsive navigation.

## Data model
The chat uses local UI state for messages. The assistant reply is currently **MOCKED** with deterministic local copy because this request is a design-only change and no external AI integration was requested. The existing `StatusCheck` API remains available as a template connectivity endpoint.

## Key flows
- Start a new chat or choose a suggested prompt.
- Send a message with Enter and receive a local assistant response.
- Select AI tool shortcuts to prefill the composer.
- Toggle light/dark presentation mode and open/close the tools rail.
- Use the responsive mobile navigation.

## Auth and roles
No authentication or gated areas.