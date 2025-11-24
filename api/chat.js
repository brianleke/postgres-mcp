import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
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

// Define tools for the AI to use
const tools = {
  execute_query: tool({
    description: 'Execute a SELECT query on the PostgreSQL database and return results. Use this for reading data, analyzing, or fetching information from the database.',
    parameters: z.object({
      query: z.string().describe('The SQL SELECT query to execute'),
      params: z.array(z.any()).optional().describe('Optional parameters for parameterized queries'),
    }),
    execute: async ({ query, params = [] }) => {
      const client = await getPool().connect();
      try {
        const trimmedQuery = query.trim().toUpperCase();
        if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('WITH')) {
          throw new Error('Only SELECT and WITH queries are allowed for execute_query');
        }

        const result = await client.query(query, params);
        return {
          success: true,
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields.map(f => ({
            name: f.name,
            dataTypeID: f.dataTypeID
          }))
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      } finally {
        client.release();
      }
    }
  }),

  execute_mutation: tool({
    description: 'Execute an INSERT, UPDATE, DELETE, or other mutating query on the PostgreSQL database. Use this for creating, updating, or deleting data.',
    parameters: z.object({
      query: z.string().describe('The SQL mutation query to execute (INSERT, UPDATE, DELETE, etc.)'),
      params: z.array(z.any()).optional().describe('Optional parameters for parameterized queries'),
    }),
    execute: async ({ query, params = [] }) => {
      const client = await getPool().connect();
      try {
        const result = await client.query(query, params);
        return {
          success: true,
          rowCount: result.rowCount,
          command: result.command,
          message: `Successfully executed ${result.command} affecting ${result.rowCount} row(s)`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      } finally {
        client.release();
      }
    }
  }),

  list_tables: tool({
    description: 'List all tables in the PostgreSQL database. Use this to discover what tables exist before querying them.',
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
          success: true,
          schema,
          tables: result.rows
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      } finally {
        client.release();
      }
    }
  }),

  describe_table: tool({
    description: 'Get detailed information about a table structure including columns, data types, primary keys, and foreign keys. Use this to understand the schema before writing queries.',
    parameters: z.object({
      tableName: z.string().describe('The name of the table to describe'),
      schema: z.string().optional().default('public').describe('The schema of the table (default: public)'),
    }),
    execute: async ({ tableName, schema = 'public' }) => {
      const client = await getPool().connect();
      try {
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
          success: true,
          schema,
          tableName,
          columns: columnsResult.rows,
          primaryKeys: pkResult.rows.map(r => r.column_name),
          foreignKeys: fkResult.rows
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      } finally {
        client.release();
      }
    }
  }),

  execute_transaction: tool({
    description: 'Execute multiple SQL statements within a transaction. All queries succeed together or all fail together (atomic operation). Use this for operations that must be completed as a unit.',
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
        return {
          success: false,
          error: `Transaction failed and rolled back: ${error.message}`
        };
      } finally {
        client.release();
      }
    }
  }),

  get_database_info: tool({
    description: 'Get general information about the PostgreSQL database including version, size, schemas, and current database name. Use this to understand the database environment.',
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
          success: true,
          version: versionResult.rows[0].version,
          databaseSize: dbSizeResult.rows[0].size,
          schemas: schemaResult.rows.map(r => r.schema_name),
          currentDatabase: (await client.query('SELECT current_database()')).rows[0].current_database
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      } finally {
        client.release();
      }
    }
  })
};

const systemPrompt = `You are a helpful PostgreSQL database assistant. You help users interact with their PostgreSQL database using natural language.

When users ask questions or request operations:
1. First understand what they want to do
2. If you don't know the database schema, use list_tables and describe_table to learn about it
3. Generate appropriate SQL queries to fulfill their request
4. Execute the queries using the available tools
5. Present the results in a clear, natural language format

Important guidelines:
- Always use parameterized queries (with $1, $2, etc.) to prevent SQL injection
- For SELECT queries, use the execute_query tool
- For INSERT, UPDATE, DELETE, use the execute_mutation tool
- For multiple related operations that must succeed together, use execute_transaction
- If you're unsure about table structure, always check with describe_table first
- Explain what you're doing and show the SQL queries you're running
- Present results in a readable format (tables, lists, summaries)
- If an operation fails, explain why and suggest alternatives

You have access to tools that interact with the database. Use them wisely and always prioritize data safety.`;

export const POST = async (req) => {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OPENAI_API_KEY is not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = streamText({
      model: openai('gpt-4-turbo-preview'),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 10, // Allow multiple tool calls to gather schema info and execute queries
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = async () => {
  return new Response(JSON.stringify({
    name: 'postgres-chat-endpoint',
    description: 'Natural language interface for PostgreSQL database',
    status: 'ready',
    availableTools: Object.keys(tools)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

