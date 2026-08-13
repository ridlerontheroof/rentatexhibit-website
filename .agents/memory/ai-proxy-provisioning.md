---
name: Replit AI proxy provisioning from task sandboxes
description: setupReplitAIIntegrations is unavailable in task environments; how the AI drafter's credentials get provisioned.
---

The `setupReplitAIIntegrations` callback is **not defined in task sandboxes** — only regular Agent chats can provision the Replit AI proxy credentials (AI_INTEGRATIONS_OPENAI_BASE_URL / AI_INTEGRATIONS_OPENAI_API_KEY).

**Why:** retrying inside a task never helps ("not defined" is structural); the fix is asking the user to run "set up the Replit OpenAI integration" in a regular chat — once done, the secrets appear in the task environment immediately.

**How to apply:** any task needing AI proxy credentials should first check the env, then route the user to a regular chat rather than requesting OPENAI_API_KEY (the owner has ChatGPT Plus only, which includes no API access).
