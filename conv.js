import 'dotenv/config';
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";


let sharedHistory = []
const executeSQL= tool({
    name: 'execute_sql',
    description: 'This executes the SQL query',
    parameters: z.object({
        sql: z.string().describe('the sql query')
    }),
    execute : async function ({sql}) {
        console.log(`sql ${sql}`)
        return "done"
    }
})
const sqlGuardRailAgent = new Agent({
    name: 'SQL Guard Rail',
    instructions: `This checks if query is safe to execute, query should be read only. Do not modify or delete or drop any table`,
    outputType: z.object({
        reason: z.string().optional().describe('reason for not being safe'),
        isSafe: z.boolean().describe('if query is executable')
    })
})

const sqlGuardRail = {
    name: 'SQL Guard',
    async execute({ agentOutput }) {
        try {
            const sqlQuery = agentOutput?.sqlQuery ?? '';
            const result = await run(sqlGuardRailAgent, sqlQuery);
            const finalOutput = result?.finalOutput ?? {};

            return {
                tripwireTriggered: finalOutput.isSafe === false,
                outputInfo: finalOutput.reason ?? 'Unsafe SQL detected.'
            };
        } catch (error) {
            console.error('SQL guardrail execution failed:', error);
            return {
                tripwireTriggered: true,
                outputInfo: error?.message ?? 'Guardrail failed unexpectedly.'
            };
        }
    }
}

const sqlInputAgent = new Agent({
    name: "SQL Expert Agent",
    tools: [executeSQL],
    instructions: `You are an expert SQL agent specialized in generating SQL queries as per user request.
    Postgres Schema: 
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        parent_id INT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );
    `,
    outputType: z.object({
        sqlQuery: z.string().optional().describe("The generated SQL query based on the user input."),
    }),
    outputGuardrails: [sqlGuardRail]
})

async function main(userInput) {
    sharedHistory.push({role: 'user', content: userInput})
    try {
        const result = await run(sqlInputAgent, sharedHistory);
        sharedHistory= result.history;
        console.log(result.finalOutput ?? result);
        return result;
    } catch (error) {
        console.error('Agent execution failed:', error);
        process.exitCode = 1;
    }
}

main("Hi my name is kartika").then(()=> {
    main("get all the uers with my name")
});