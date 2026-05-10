---
title: Building MCP Servers — Production Patterns
category: agentes-ia
stack: [MCP, Model Context Protocol, Python SDK, TypeScript SDK]
tags: [mcp, mcp-server, transports, security, building]
excerpt: "Building MCP servers production-grade — stdio vs SSE transports, security, deployment, Claude Desktop + Code integration, sandboxing."
related: [mcp-protocol, sec-agent-mcp-security, claude-code-sdk]
updated: "2026-05-10"
---

## Por que construir MCP server

MCP (Model Context Protocol, Anthropic 2024) padroniza como LLM agents acessam external data + tools. Em 2026:

- Cresceu rapido: 200+ servers públicos.
- Claude Desktop, Claude Code, Cursor, e clients custom suportam.
- Substitui custom plugin formats.

Quando construir MCP server vs usar existing:
- **Use existing** se algo cobre seu use case (slack, github, postgres já têm).
- **Build próprio** para integração interna (sua API, your data sources).

## MCP architecture

```
┌──────────────┐         ┌──────────────┐
│   Client     │◄───────►│   Server     │
│ (Claude Code)│   JSON  │ (your code)  │
│              │   RPC   │              │
└──────────────┘         └──────────────┘
       ▲                         │
       │                         │
   Tools called             Tools defined
   Resources read           Resources exposed
   Prompts used             Prompts defined
```

### MCP primitives

1. **Tools** — functions LLM can call (`get_weather`, `search_db`).
2. **Resources** — data LLM can read (file://, http://, custom://).
3. **Prompts** — pre-built prompt templates user can invoke.

Plus:
- **Sampling** — server can request LLM completion (reverse direction).
- **Roots** — filesystem boundaries.

## Transports

MCP suporta 3 transports:

### 1. **stdio** — local, recommended pra desktop

Server roda como subprocess do client. Comunicação via stdin/stdout.

```bash
# Client launches server
claude-desktop spawn-server: python my_mcp_server.py
# Server lê JSON-RPC requests from stdin, escreve responses to stdout
```

Pros: simple, secure (no network exposed), zero infra.
Cons: only local, 1 user.

Use for: Claude Desktop, Claude Code, local dev tools.

### 2. **SSE (Server-Sent Events)** — HTTP-based, remote

Server is HTTP service. Client connects via SSE.

```python
# Server exposes endpoint:
GET /mcp/sse  → SSE stream
POST /mcp/messages → send commands
```

Pros: remote access, multi-user.
Cons: needs auth, infra to deploy.

Use for: hosted MCP servers, team-shared servers.

### 3. **HTTP (newer, 2025+)**

Pure HTTP request/response, simpler than SSE.

Pros: simplest infra.
Cons: no streaming.

Use for: stateless, simple tools.

## Building com Python SDK

```bash
pip install mcp
```

```python
# server.py
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types

server = Server("my-tools")

# Register tools
@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_weather",
            description="Get current weather for a city",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string"},
                    "unit": {"type": "string", "enum": ["c", "f"]}
                },
                "required": ["city"]
            }
        ),
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None) -> list[types.TextContent]:
    if name == "get_weather":
        city = arguments["city"]
        unit = arguments.get("unit", "c")
        # Real logic
        weather = await fetch_weather(city, unit)
        return [types.TextContent(type="text", text=f"Weather in {city}: {weather}")]
    raise ValueError(f"Unknown tool: {name}")

# Register resources
@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri="config://database",
            name="Database config",
            description="Current database configuration",
            mimeType="application/json"
        ),
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    if uri == "config://database":
        return json.dumps({"host": "...", "name": "..."})
    raise ValueError(f"Unknown resource: {uri}")

# Run via stdio
async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(
            read,
            write,
            InitializationOptions(
                server_name="my-tools",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

## Building com TypeScript SDK

```bash
npm install @modelcontextprotocol/sdk
```

```typescript
// server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-tools", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather",
        description: "Get weather for city",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string" },
            unit: { type: "string", enum: ["c", "f"] }
          },
          required: ["city"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  
  if (name === "get_weather") {
    const weather = await fetchWeather(args.city, args.unit);
    return {
      content: [{ type: "text", text: `Weather: ${weather}` }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Integrating with Claude Desktop

Claude Desktop reads `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "python",
      "args": ["/path/to/my_mcp_server.py"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

Restart Claude Desktop. Tools appear in chat.

## Integrating with Claude Code

```bash
# Add MCP server to Claude Code
claude mcp add my-tools "python /path/to/my_mcp_server.py"

# Or in .mcp.json (project-level)
{
  "mcpServers": {
    "my-tools": {
      "command": "python",
      "args": ["./mcp/my_server.py"]
    }
  }
}
```

`claude mcp list` to see registered.

## Security — critical

MCP servers run **with permissions of user**. Security is real concern. See `sec-agent-mcp-security` for full coverage. Highlights:

### 1. Authentication

Stdio: trusted (subprocess local).
SSE/HTTP: must auth.

```python
@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    # Get auth from header (SSE/HTTP)
    user = get_authenticated_user(request)
    
    # Check authz before action
    if not user.can_read(uri):
        raise PermissionError("Access denied")
    
    return await fetch_resource(uri)
```

### 2. Input validation

```python
@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None):
    if name == "search_db":
        # Validate input
        query = arguments.get("query", "")
        if len(query) > 1000:
            raise ValueError("Query too long")
        if any(banned in query.lower() for banned in ["drop", "delete", "update"]):
            raise ValueError("Read-only queries only")
        
        # Use parameterized
        results = await db.execute("SELECT * FROM items WHERE name LIKE %s", (f"%{query}%",))
        return [types.TextContent(text=str(results))]
```

### 3. Sandboxing for risky tools

```python
import subprocess

@server.call_tool()
async def execute_script(name: str, arguments: dict):
    if name == "run_python":
        code = arguments["code"]
        # Sandbox in container or subprocess with restrictions
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True,
            timeout=10,
            # Limit resources, no network, etc.
        )
        return [types.TextContent(text=result.stdout.decode())]
```

For production: use proper sandbox (Docker, gVisor, Firecracker).

### 4. Allowlists for sensitive ops

```python
ALLOWED_FILE_PATTERNS = ["/data/**/*.csv", "/configs/*.yaml"]

@server.read_resource()
async def handle_read_resource(uri: str):
    if uri.startswith("file://"):
        path = uri[7:]
        if not any(fnmatch.fnmatch(path, p) for p in ALLOWED_FILE_PATTERNS):
            raise PermissionError(f"Path not allowed: {path}")
        return open(path).read()
```

### 5. Rate limiting

```python
from collections import defaultdict
import time

rate_limit = defaultdict(list)

@server.call_tool()
async def handle_call_tool(name: str, args):
    user_id = get_user_id()
    now = time.time()
    rate_limit[user_id] = [t for t in rate_limit[user_id] if now - t < 60]
    
    if len(rate_limit[user_id]) > 30:
        raise RateLimitError("Too many requests")
    
    rate_limit[user_id].append(now)
    # ... rest
```

## Deployment patterns

### Pattern 1: Local subprocess (stdio)

User installs Python/Node + your server code locally. Configure Claude Desktop manually.

Pros: zero infra.
Cons: distribution problem.

### Pattern 2: NPX/Pipx hosted

Publish server as package:

```bash
# Users install via:
pipx install my-mcp-tools
# Or:
npx -y @myorg/mcp-tools
```

Claude Desktop config:
```json
{
  "mcpServers": {
    "my-tools": {
      "command": "npx",
      "args": ["-y", "@myorg/mcp-tools"]
    }
  }
}
```

Pros: easy install.
Cons: requires runtime (Node/Python).

### Pattern 3: Hosted SSE server

Deploy to cloud, users connect via URL.

```python
from fastapi import FastAPI
from mcp.server.sse import SseServerTransport

app = FastAPI()
sse_transport = SseServerTransport("/messages")

@app.get("/sse")
async def sse_endpoint(request: Request):
    async with sse_transport.connect_sse(...) as streams:
        await server.run(streams[0], streams[1], ...)

@app.post("/messages")
async def messages_endpoint(...):
    return await sse_transport.handle_post_message(...)
```

Pros: centrally maintained, multi-user.
Cons: deployment overhead, auth complexity.

### Pattern 4: Docker container

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -e .
CMD ["python", "-m", "my_mcp_server"]
```

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "myorg/mcp-tools:latest"]
    }
  }
}
```

Pros: isolated, version-pinned.
Cons: Docker overhead, slower startup.

## Examples — real MCP servers

### Database access

```python
@server.list_tools()
async def tools():
    return [
        types.Tool(
            name="query_db",
            description="Execute READ-ONLY SQL query. SELECT only.",
            inputSchema={
                "type": "object",
                "properties": {"sql": {"type": "string"}},
                "required": ["sql"]
            }
        )
    ]

@server.call_tool()
async def call(name, args):
    if name == "query_db":
        sql = args["sql"]
        # Validate read-only
        if not sql.strip().upper().startswith("SELECT"):
            return [types.TextContent(text="Error: only SELECT allowed")]
        
        # Execute with timeout
        async with db_pool.acquire() as conn:
            results = await asyncio.wait_for(
                conn.fetch(sql), timeout=10
            )
            return [types.TextContent(text=str([dict(r) for r in results]))]
```

### File operations

```python
@server.list_resources()
async def resources():
    files = list_files_in_workspace()
    return [
        types.Resource(uri=f"file://{f}", name=f, mimeType=guess_mime(f))
        for f in files
    ]

@server.read_resource()
async def read(uri: str):
    if uri.startswith("file://"):
        path = uri[7:]
        # Allowlist
        if not is_in_workspace(path):
            raise PermissionError()
        return open(path).read()
```

### External API integration

```python
@server.list_tools()
async def tools():
    return [
        types.Tool(
            name="github_create_issue",
            description="Create GitHub issue in given repo",
            inputSchema={
                "type": "object",
                "properties": {
                    "repo": {"type": "string", "pattern": "^[\\w-]+/[\\w-]+$"},
                    "title": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["repo", "title"]
            }
        )
    ]

@server.call_tool()
async def call(name, args):
    if name == "github_create_issue":
        # Use auth token from env
        gh_token = os.environ["GITHUB_TOKEN"]
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.github.com/repos/{args['repo']}/issues",
                headers={"Authorization": f"token {gh_token}"},
                json={"title": args["title"], "body": args.get("body", "")},
            )
        return [types.TextContent(text=str(response.json()))]
```

## Testing MCP server

```python
# test_server.py
import pytest
from my_mcp_server import server

@pytest.mark.asyncio
async def test_list_tools():
    tools = await server._tool_list_handler()
    assert any(t.name == "get_weather" for t in tools)

@pytest.mark.asyncio
async def test_call_tool():
    result = await server._call_tool_handler("get_weather", {"city": "Paris"})
    assert "Paris" in result[0].text

@pytest.mark.asyncio
async def test_invalid_tool():
    with pytest.raises(ValueError):
        await server._call_tool_handler("nonexistent", {})
```

Manual test with Claude Desktop:
1. Configure server in claude_desktop_config.json.
2. Restart Claude.
3. Ask: "List your tools" → Claude calls list_tools, replies.
4. Ask: "What's weather in Paris" → Claude calls your tool.

## Distribution patterns

### Open-source community server

```toml
# pyproject.toml
[project]
name = "mcp-server-mytools"
version = "0.1.0"
dependencies = ["mcp>=0.1.0", "..."]

[project.scripts]
mcp-server-mytools = "my_module:main"
```

Publish to PyPI: `pip publish`. Users install via pip/pipx.

For TS: publish to npm.

### Private corporate server

Distribute via internal package registry (Artifactory, etc.). User installs from internal source.

Or hosted SSE behind VPN/SSO.

## Versioning

Follow semver. Breaking changes in tool schemas = major bump.

```python
# Server announces version
server_capabilities = ServerCapabilities(
    tools=ToolsCapability(),
    # ...
)
server = Server(name="my-tools", version="1.2.0", capabilities=server_capabilities)
```

Client checks compatibility. Document changes in CHANGELOG.

## Common pitfalls

### 1. Tool description vague
LLM doesn't know when to call. Write detailed descriptions com examples.

### 2. No input validation
Receives garbage, crashes or RCE. Validate every arg.

### 3. Synchronous blocking
Long-running tool blocks server. Use async + timeout.

### 4. Leaking secrets in errors
`raise Exception(f"DB error: {DB_PASSWORD}")`. Sanitize error messages.

### 5. Resource enumeration too greedy
List 10k resources. Pagination ou search.

### 6. No telemetry
Silent failures. Add structured logging.

## Production deploy checklist

- [ ] Auth implementado (SSE/HTTP)?
- [ ] Input validation em todos os tools?
- [ ] Rate limiting per user/IP?
- [ ] Timeouts em tool execution?
- [ ] Sandbox para risky tools (exec, shell)?
- [ ] Allowlist file paths / SQL operations?
- [ ] Audit logs (who called what when)?
- [ ] Health endpoint?
- [ ] Versioned (semver)?
- [ ] Tests?
- [ ] Docs (README com examples)?

## Leituras

- MCP spec (modelcontextprotocol.io)
- Python SDK (github.com/modelcontextprotocol/python-sdk)
- TypeScript SDK (github.com/modelcontextprotocol/typescript-sdk)
- "Building MCP Servers" — Anthropic tutorials
- mcp-servers reference repository (community examples)
- Anthropic Cookbook MCP examples
