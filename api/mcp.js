import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import pg from 'pg';
import { z } from 'zod';

const { Pool } = pg;

// Initialize PostgreSQL connection pool
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Authentication function (optional - checks API key if provided)
async function authenticateRequest(req) {
  // If MCP_API_KEY is set in environment, require authentication
  const requiredApiKey = process.env.MCP_API_KEY;
  
  if (!requiredApiKey) {
    // No authentication required
    return { authorized: true };
  }
  
  // Check for API key in Authorization header or x-api-key header
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

// MCP Tools for PostgreSQL operations
const tools = {
  execute_query: {
    description: 'Execute a SELECT query on the PostgreSQL database and return results',
    parameters: z.object({
      query: z.string().describe('The SQL SELECT query to execute'),
      params: z.array(z.any()).optional().describe('Optional parameters for parameterized queries'),
    }),
    execute: async ({ query, params = [] }) => {
      const client = await getPool().connect();
      try {
        // Security: Only allow SELECT queries
        const trimmedQuery = query.trim().toUpperCase();
        if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('WITH')) {
          throw new Error('Only SELECT and WITH queries are allowed for execute_query');
        }

        const result = await client.query(query, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields.map(f => ({
            name: f.name,
            dataTypeID: f.dataTypeID
          }))
        };
      } catch (error) {
        throw new Error(`Query execution failed: ${error.message}`);
      } finally {
        client.release();
      }
    }
  },

  execute_mutation: {
    description: 'Execute an INSERT, UPDATE, DELETE, or other mutating query on the PostgreSQL database',
    parameters: z.object({
      query: z.string().describe('The SQL mutation query to execute (INSERT, UPDATE, DELETE, etc.)'),
      params: z.array(z.any()).optional().describe('Optional parameters for parameterized queries'),
    }),
    execute: async ({ query, params = [] }) => {
      const client = await getPool().connect();
      try {
        const result = await client.query(query, params);
        return {
          rowCount: result.rowCount,
          command: result.command,
          message: `Successfully executed ${result.command} affecting ${result.rowCount} row(s)`
        };
      } catch (error) {
        throw new Error(`Mutation execution failed: ${error.message}`);
      } finally {
        client.release();
      }
    }
  },

  list_tables: {
    description: 'List all tables in the current PostgreSQL database',
    parameters: z.object({
      schema: z.string().optional().default('public').describe('The schema to list tables from (default: public)'),
    }),
    execute: async ({ schema = 'public' }) => {
      const client = await getPool().connect();
      try {
        const result = await client.query(
          `SELECT table_name, table_type 
           FROM information_schema.tables 
           WHERE table_schema = $1 
           ORDER BY table_name`,
          [schema]
        );
        return {
          schema,
          tables: result.rows
        };
      } catch (error) {
        throw new Error(`Failed to list tables: ${error.message}`);
      } finally {
        client.release();
      }
    }
  },

  describe_table: {
    description: 'Get detailed information about a table structure including columns, types, and constraints',
    parameters: z.object({
      tableName: z.string().describe('The name of the table to describe'),
      schema: z.string().optional().default('public').describe('The schema of the table (default: public)'),
    }),
    execute: async ({ tableName, schema = 'public' }) => {
      const client = await getPool().connect();
      try {
        // Get column information
        const columnsResult = await client.query(
          `SELECT 
            column_name, 
            data_type, 
            character_maximum_length,
            is_nullable,
            column_default
           FROM information_schema.columns 
           WHERE table_schema = $1 AND table_name = $2
           ORDER BY ordinal_position`,
          [schema, tableName]
        );

        // Get primary key information
        const pkResult = await client.query(
          `SELECT c.column_name
           FROM information_schema.table_constraints tc 
           JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) 
           JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
             AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
           WHERE constraint_type = 'PRIMARY KEY' 
             AND tc.table_schema = $1 
             AND tc.table_name = $2`,
          [schema, tableName]
        );

        // Get foreign key information
        const fkResult = await client.query(
          `SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
           FROM information_schema.table_constraints AS tc
           JOIN information_schema.key_column_usage AS kcu
             ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
           JOIN information_schema.constraint_column_usage AS ccu
             ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema = tc.table_schema
           WHERE tc.constraint_type = 'FOREIGN KEY'
             AND tc.table_schema = $1
             AND tc.table_name = $2`,
          [schema, tableName]
        );

        return {
          schema,
          tableName,
          columns: columnsResult.rows,
          primaryKeys: pkResult.rows.map(r => r.column_name),
          foreignKeys: fkResult.rows
        };
      } catch (error) {
        throw new Error(`Failed to describe table: ${error.message}`);
      } finally {
        client.release();
      }
    }
  },

  execute_transaction: {
    description: 'Execute multiple SQL statements within a transaction',
    parameters: z.object({
      queries: z.array(z.object({
        query: z.string(),
        params: z.array(z.any()).optional()
      })).describe('Array of queries to execute in the transaction'),
    }),
    execute: async ({ queries }) => {
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        
        const results = [];
        for (const { query, params = [] } of queries) {
          const result = await client.query(query, params);
          results.push({
            command: result.command,
            rowCount: result.rowCount
          });
        }
        
        await client.query('COMMIT');
        
        return {
          success: true,
          results,
          message: `Successfully executed ${queries.length} queries in transaction`
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Transaction failed and rolled back: ${error.message}`);
      } finally {
        client.release();
      }
    }
  },

  get_database_info: {
    description: 'Get general information about the PostgreSQL database',
    parameters: z.object({}),
    execute: async () => {
      const client = await getPool().connect();
      try {
        const versionResult = await client.query('SELECT version()');
        const dbSizeResult = await client.query(
          `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
        );
        const schemaResult = await client.query(
          `SELECT schema_name 
           FROM information_schema.schemata 
           WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
           ORDER BY schema_name`
        );
        
        return {
          version: versionResult.rows[0].version,
          databaseSize: dbSizeResult.rows[0].size,
          schemas: schemaResult.rows.map(r => r.schema_name),
          currentDatabase: (await client.query('SELECT current_database()')).rows[0].current_database
        };
      } catch (error) {
        throw new Error(`Failed to get database info: ${error.message}`);
      } finally {
        client.release();
      }
    }
  }
};

// Create the MCP handler with optional authentication
const mcpHandler = createMcpHandler({
  name: 'postgres-mcp-server',
  version: '1.0.0',
  tools,
});

// Wrap with authentication middleware if MCP_API_KEY is set
export const POST = process.env.MCP_API_KEY 
  ? withMcpAuth(mcpHandler, authenticateRequest)
  : mcpHandler;

// Health check endpoint
export const GET = async (req) => {
  return new Response(JSON.stringify({
    name: 'postgres-mcp-server',
    version: '1.0.0',
    status: 'running',
    tools: Object.keys(tools)
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

