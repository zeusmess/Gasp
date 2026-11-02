---
name: omniroute
description: "Entry point for OmniRoute, the open-source AI gateway (github.com/cheaper-inference/OmniRoute, MIT). Use when the user wants to route LLM calls through OmniRoute, start/configure the gateway, add providers or free tiers, build routing combos/fallbacks, check quotas, costs or health, or use the `omniroute` MCP tools. Points to the 45 omni-* (REST API) and cli-* (CLI) skills."
---

# OmniRoute

OmniRoute is an OpenAI-compatible gateway (default `http://localhost:20128`) that routes requests
across ~380 providers with fallback, combos, compression (RTK/Caveman), caching, budgets and quotas.

## Set up

```bash
npm i -g omniroute@3.8.52   # CLI + server; or use `npx -y omniroute@3.8.52 ...`
omniroute                    # start gateway + dashboard on :20128
omniroute --mcp              # MCP server over stdio (what .mcp.json runs)
```

Env vars used by the MCP server and skills:
- `OMNIROUTE_BASE_URL` (default `http://localhost:20128`)
- `OMNIROUTE_API_KEY` / `OMNIROUTE_TOKEN`: Bearer key from the dashboard → API Keys
- `OMNIROUTE_MCP_SCOPES` optional: limit which MCP tools are allowed

Provider credentials are added in the dashboard (`/dashboard/providers`) or with `omniroute providers add`.
Never commit API keys.

## Use as a tool

The repo's `.mcp.json` registers the `omniroute` MCP server (~110 tools such as `omniroute_get_health`,
`omniroute_route_request`, `omniroute_check_quota`, `omniroute_list_models_catalog`,
`omniroute_simulate_route`, `omniroute_cost_report`, `omniroute_web_search`). Most tools need the gateway
running at `OMNIROUTE_BASE_URL`; start it first.

To point Claude Code itself at the gateway: `ANTHROPIC_BASE_URL=http://localhost:20128` plus an OmniRoute API key.

## Pick a skill

- REST API: `omni-auth` (start here), `omni-inference`, `omni-providers`, `omni-models`,
  `omni-combos-routing`, `omni-api-keys`, `omni-usage-logs`, `omni-budget`, `omni-settings`, `omni-proxies`,
  `omni-cache`, `omni-compression`, `omni-context-rtk`, `omni-resilience`, `omni-cli-tools`, `omni-tunnels`,
  `omni-sync-cloud`, `omni-db-backups`, `omni-webhooks`, `omni-mcp`, `omni-agents-a2a`,
  `omni-version-manager`, `omni-github-skills`
- CLI: `cli-serve` (start here), `cli-setup`, `cli-health`, `cli-providers`, `cli-keys`, `cli-models`,
  `cli-chat`, `cli-routing`, `cli-resilience`, `cli-compression`, `cli-contexts`, `cli-cost-usage`, `cli-mcp`,
  `cli-a2a`, `cli-tunnel`, `cli-backup-sync`, `cli-policy-audit`, `cli-batches`, `cli-eval`,
  `cli-plugins-skills`, `cli-skill-collector`, `config-codex-cli`

Upstream docs: https://github.com/cheaper-inference/OmniRoute/tree/main/docs
