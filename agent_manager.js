import 'dotenv/config';
import {Agent, run, tool} from "@openai/agents";
import {z} from "zod";
import fs from "node:fs/promises";

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



async function main(query = '') {
  const response = await run(salesAgent, query);
  console.log(response.finalOutput);
  return response.finalOutput;
}

main("I want to get the refund of my plan. My customer id is 12345 and the reason is 'I am not satisfied with the service'")
  .catch((error) => {
    console.error('Agent execution failed:', error);
    process.exitCode = 1;
  });
