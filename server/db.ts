import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket with retry logic
class WebSocketWithRetry extends ws {
  private readonly maxRetries: number = 5;
  private retryCount: number = 0;
  private readonly retryDelay: number = 1000;
  private readonly wsUrl: string;
  private readonly wsOptions: any;

  constructor(url: string, options: any) {
    super(url, options);
    this.wsUrl = url;
    this.wsOptions = options;
    this.addEventListener('error', this.handleError.bind(this));
  }

  private handleError(error: any) {
    console.error('WebSocket error:', error.message);
    if (this.retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, this.retryCount);
      console.log(`Retrying connection in ${delay}ms... (Attempt ${this.retryCount + 1}/${this.maxRetries})`);
      setTimeout(() => {
        this.retryCount++;
        // Create a new connection
        new WebSocketWithRetry(this.wsUrl, this.wsOptions);
      }, delay);
    } else {
      console.error('Max retries reached. Please check your database connection.');
    }
  }
}

neonConfig.webSocketConstructor = WebSocketWithRetry;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to database...');

// Configure pool with better settings
export const pool = new Pool({ 
  connectionString,
  ssl: true,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // how long to wait for a connection
  maxUses: 7500 // close & replace a connection after it's been used this many times
});

// Test the connection with retry logic
const connectWithRetry = async (retries = 5) => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying database connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectWithRetry(retries - 1);
    }
    console.error('Database connection error:', err);
    throw err;
  }
};

connectWithRetry().catch(console.error);

export const db = drizzle({ client: pool, schema });
