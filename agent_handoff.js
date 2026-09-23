import 'dotenv/config';
import { Agent, run, tool } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX} from "@openai/agents-core/extensions"
import { z } from "zod";
import fs from "node:fs/promises";

const processRefundTool = tool({
  name: "process_refund",
  description: "Processes a refund for a given user.", 
  parameters: z.object({ 
    customer_id: z.string().describe("The ID of the user requesting a refund."),
    reason: z.string().describe("The reason for the refund request."),
  }),
  execute: async function({ customer_id, reason }) {
    await fs.appendFile('./refunds.txt', `Refund processed for user ${customer_id} due to reason: ${reason}\n`, 'utf-8');
    return {refundIssued: true}
  }
})

const fetchAvailableTools = tool({ 
  name: "fetch_available_tools",
  description: "Fetches a list of available plans.",
  parameters: z.object({}),
  execute: async function() {
    return [{
        plan_id: "1",
        plan_name: "Basic Plan",
        plan_inr: 499,
        plan_speed: "100 Mbps",
    }, {
        plan_id: "2",
        plan_name: "Standard Plan",
        plan_inr: 799,
        plan_speed: "100 Mbps",
    }];
  }
})


const refundAgent = new Agent({
  name: "Refund Agent",
  instructions: "You are a refund agent, for a internet broadband company who talks to user and help them get their refunds if they are not happy with the service or want to terminate the services",
  tools: [processRefundTool],
});


const salesAgent = new Agent({
  name: "Sales Agent",
  instructions: "You are a sales agent, for a internet broadband company who talks to user and help them with what they need",
  tools: [fetchAvailableTools, refundAgent.asTool({
    toolName: "process_refund",
    toolDescription: "Processes a refund for a given user or help with refund related queries. It takes customer_id and reason as parameters.",
  })],
});

const receptionAgent = new Agent({ 
    name: "Reception Agent",
    instructions: ` ${RECOMMENDED_PROMPT_PREFIX} You are a reception agent, for a internet broadband company who talks to user and help them with what they need. You can either help the user with their queries or handoff the user to the sales agent or refund agent based on the user's query.`,
    handoffDescription: "If the user is asking for a refund, handoff the user to the refund agent. If the user is asking for available plans, handoff the user to the sales agent. If the user is asking for any other queries, handle it yourself.",
    handoffAgents: [salesAgent, refundAgent],
})

async function main(query = '') {
  const response = await run(receptionAgent, query);
  console.log(response.finalOutput);
  return response.finalOutput;
}

main("Tell me about your plans")