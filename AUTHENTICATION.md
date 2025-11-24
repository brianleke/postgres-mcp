# Authentication Guide

The PostgreSQL MCP Server supports optional authentication for the MCP endpoint using `withMcpAuth` from the `mcp-handler` package.

## 🔐 Enabling Authentication

To enable authentication, simply set the `MCP_API_KEY` environment variable:

```env
MCP_API_KEY=your-secret-api-key-here
```

When this variable is set, all requests to the `/api/mcp` endpoint will require authentication.

## 📤 Making Authenticated Requests

### Option 1: Authorization Header

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "list_tables",
    "parameters": { "schema": "public" }
  }'
```

### Option 2: X-API-Key Header

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "x-api-key: your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "execute_query",
    "parameters": {
      "query": "SELECT * FROM users LIMIT 10"
    }
  }'
```

## 🔧 Implementation Details

The authentication is implemented using `withMcpAuth` middleware from `mcp-handler`:

```javascript
import { createMcpHandler, withMcpAuth } from 'mcp-handler';

// Authentication function
async function authenticateRequest(req) {
  const requiredApiKey = process.env.MCP_API_KEY;
  
  if (!requiredApiKey) {
    return { authorized: true };
  }
  
  const authHeader = req.headers.get('authorization');
  const apiKeyHeader = req.headers.get('x-api-key');
  const providedKey = authHeader?.replace('Bearer ', '') || apiKeyHeader;
  
  if (providedKey === requiredApiKey) {
    return { authorized: true };
  }
  
  return { 
    authorized: false, 
    error: 'Invalid or missing API key' 
  };
}

// Wrap handler with authentication
export const POST = withMcpAuth(mcpHandler, authenticateRequest);
```

## 🌐 Deployment with Authentication

### Vercel

```bash
# Add the API key to Vercel
vercel env add MCP_API_KEY production
# Enter your secret key when prompted

# Deploy
vercel --prod
```

### Local Development

```bash
# Add to .env file
echo "MCP_API_KEY=dev-secret-key-123" >> .env

# Start the server
npm run dev
```

## 🔒 Security Best Practices

### 1. Generate Strong API Keys

```bash
# On Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Use Different Keys for Different Environments

```env
# Development
MCP_API_KEY=dev-key-for-local-testing

# Production
MCP_API_KEY=prod-super-secret-key-do-not-share
```

### 3. Rotate Keys Regularly

Update your API keys periodically and update them in:
- Environment variables
- Client applications
- Documentation

### 4. Never Commit Keys to Git

The `.gitignore` file already excludes `.env` files. Make sure your keys stay secret!

## 🧪 Testing Authentication

### Test Without API Key (Should Fail)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_tables", "parameters": {}}'
```

Expected response:
```json
{
  "error": "Invalid or missing API key"
}
```

### Test With Correct API Key (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_tables", "parameters": {}}'
```

Expected response:
```json
{
  "schema": "public",
  "tables": [...]
}
```

## 🔓 Disabling Authentication

To disable authentication, simply remove or comment out the `MCP_API_KEY` environment variable:

```env
# MCP_API_KEY=your-secret-api-key  # Commented out
```

The endpoint will then accept unauthenticated requests.

## 🤝 Authentication in Client Applications

### JavaScript/Node.js

```javascript
const apiKey = process.env.MCP_API_KEY;

async function callMcp(tool, parameters) {
  const response = await fetch('https://your-app.vercel.app/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ tool, parameters })
  });
  
  return await response.json();
}
```

### Python

```python
import os
import requests

api_key = os.getenv('MCP_API_KEY')
url = 'https://your-app.vercel.app/api/mcp'

def call_mcp(tool, parameters):
    response = requests.post(
        url,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        },
        json={'tool': tool, 'parameters': parameters}
    )
    return response.json()
```

### cURL

```bash
#!/bin/bash
API_KEY="your-secret-api-key"
URL="https://your-app.vercel.app/api/mcp"

curl -X POST "$URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_tables", "parameters": {}}'
```

## 📊 Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Send request with API key
       ▼
┌─────────────────┐
│  withMcpAuth    │
│   Middleware    │
└──────┬──────────┘
       │
       │ 2. Validate API key
       ▼
    ┌──────┐
    │ Valid?│
    └───┬──┘
        │
    ┌───▼───┐
    │ Yes   │ No
    │       │
    ▼       ▼
┌───────┐ ┌──────┐
│Process│ │Return│
│Request│ │ 401  │
└───────┘ └──────┘
```

## 💡 Advanced: Custom Authentication

You can customize the authentication logic by modifying the `authenticateRequest` function:

### Example: Multiple API Keys

```javascript
async function authenticateRequest(req) {
  const validKeys = [
    process.env.MCP_API_KEY_1,
    process.env.MCP_API_KEY_2,
    process.env.MCP_API_KEY_3
  ].filter(Boolean);
  
  if (validKeys.length === 0) {
    return { authorized: true };
  }
  
  const authHeader = req.headers.get('authorization');
  const apiKeyHeader = req.headers.get('x-api-key');
  const providedKey = authHeader?.replace('Bearer ', '') || apiKeyHeader;
  
  if (validKeys.includes(providedKey)) {
    return { authorized: true };
  }
  
  return { 
    authorized: false, 
    error: 'Invalid or missing API key' 
  };
}
```

### Example: JWT Authentication

```javascript
import jwt from 'jsonwebtoken';

async function authenticateRequest(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return { authorized: false, error: 'No token provided' };
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { authorized: true, user: decoded };
  } catch (error) {
    return { authorized: false, error: 'Invalid token' };
  }
}
```

## 📝 Notes

- The natural language endpoint (`/api/chat`) does **not** use this authentication by default
- You can add similar authentication to the chat endpoint if needed
- The health check endpoint (`GET /api/mcp`) is not authenticated
- Authentication only applies when `MCP_API_KEY` is set

## 🆘 Troubleshooting

### "Invalid or missing API key"
- Check that `MCP_API_KEY` matches between server and client
- Verify the header format (Bearer token or x-api-key)
- Ensure there are no extra spaces or characters

### Authentication Not Working
- Make sure `MCP_API_KEY` is set in environment variables
- Restart the server after adding the environment variable
- Check that you're sending the key in the correct header

### Still Getting Through Without Key
- Verify `MCP_API_KEY` is actually set: `echo $MCP_API_KEY`
- Check the environment in Vercel dashboard
- Clear any caches and redeploy

---

For more information, see the [mcp-handler documentation](https://github.com/modelcontextprotocol/mcp-handler).

