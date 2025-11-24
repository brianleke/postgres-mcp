# Deployment Guide

## Quick Start Deployment

### Step 1: Prepare Your Database

Ensure you have a PostgreSQL database ready. If you don't have one, you can use:
- [Neon](https://neon.tech) - Free tier with generous limits
- [Supabase](https://supabase.com) - Free tier with PostgreSQL
- [Railway](https://railway.app) - Simple PostgreSQL deployment

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install dependencies
npm install

# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# Add environment variables in production
vercel env add DATABASE_URL production
# Paste your database URL when prompted

vercel env add DATABASE_SSL production
# Enter 'true' or 'false' based on your database requirements
```

#### Option B: Using Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `DATABASE_SSL`: `true` or `false`
6. Click "Deploy"

### Step 3: Test Your Deployment

After deployment, test the endpoint:

```bash
# Health check
curl https://your-project.vercel.app/api/mcp

# Test with a tool call (requires your client to send proper MCP requests)
```

## Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

### Examples:

**Local PostgreSQL:**
```
postgresql://postgres:password@localhost:5432/mydb
```

**Neon:**
```
postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Supabase:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres
```

**Railway:**
```
postgresql://postgres:password@containers-us-west-12.railway.app:5432/railway
```

## Security Best Practices

### 1. Connection Pooling
The server uses connection pooling with sensible defaults:
- Max connections: 10
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

### 2. Parameterized Queries
Always use parameterized queries to prevent SQL injection:

```javascript
// Good ✅
{ query: "SELECT * FROM users WHERE id = $1", params: [userId] }

// Bad ❌
{ query: `SELECT * FROM users WHERE id = ${userId}` }
```

### 3. Query Restrictions
The `execute_query` tool only allows SELECT and WITH queries. Use `execute_mutation` for write operations.

### 4. SSL/TLS
Enable SSL for production databases:
```
DATABASE_SSL=true
```

### 5. Database Permissions
Create a dedicated database user with limited permissions:

```sql
-- Create a user for the MCP server
CREATE USER mcp_server WITH PASSWORD 'secure_password';

-- Grant specific permissions
GRANT CONNECT ON DATABASE mydb TO mcp_server;
GRANT USAGE ON SCHEMA public TO mcp_server;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mcp_server;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mcp_server;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mcp_server;
```

## Monitoring and Debugging

### View Logs in Vercel

1. Go to your project in Vercel dashboard
2. Click on "Deployments"
3. Click on a deployment
4. Click "Functions" tab
5. View logs for `/api/mcp`

### Common Issues

#### Issue: "Connection timeout"
**Solution**: 
- Check if your database allows connections from Vercel
- Verify the DATABASE_URL is correct
- Ensure firewall rules allow Vercel IPs

#### Issue: "SSL required"
**Solution**: 
- Set `DATABASE_SSL=true` in environment variables
- Or add `?sslmode=require` to your connection string

#### Issue: "Too many connections"
**Solution**:
- Reduce the `max` parameter in the pool configuration
- Use a connection pooler like PgBouncer

## Performance Optimization

### 1. Connection Pool Tuning
Adjust pool settings in `api/mcp.js` based on your needs:

```javascript
pool = new Pool({
  max: 10,                      // Reduce if hitting connection limits
  idleTimeoutMillis: 30000,     // How long idle connections stay open
  connectionTimeoutMillis: 2000, // How long to wait for connection
});
```

### 2. Query Optimization
- Add indexes for frequently queried columns
- Use EXPLAIN ANALYZE to identify slow queries
- Consider pagination for large result sets

### 3. Caching
For read-heavy workloads, consider adding caching:
- Vercel Edge Cache
- Redis/Upstash for query results
- PostgreSQL query result cache

## Scaling Considerations

### Serverless Limitations
- Cold starts: First request may be slower
- Execution time: Vercel has time limits (10s for hobby, 60s for pro)
- Memory: Limited by your Vercel plan

### Solutions
- Use Vercel Pro for longer timeouts
- Implement query timeouts in PostgreSQL
- Break large operations into smaller batches
- Consider using background jobs for long-running tasks

## Cost Estimation

### Vercel
- Hobby plan: Free for personal projects
- Pro plan: $20/month/user with higher limits

### Database
- Neon: Free tier available
- Supabase: Free tier available  
- Self-hosted: Variable based on hosting

## Next Steps

1. Add authentication (API keys, OAuth, etc.)
2. Implement rate limiting
3. Add request logging and monitoring
4. Set up alerts for errors
5. Create database migrations system
6. Add automated testing

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)

