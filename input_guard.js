import 'dotenv/config';
import { Agent, run } from "@openai/agents";
import {z} from "zod";




const mathInputAgent = new Agent({
  name: "Math Input Agent",
  instructions: `You are an expert agent who checks if the question asked is maths question or not. The question should be math equation or math problem. `,
  outputType: z.object({
    isMathQuestion: z.boolean().describe("Indicates whether the input is a math question or not."),
  }),
});
const mathInputGuardRail = {
    name: "Math Input Guardrail",
    execute: (input) => {
        
        const result = run(mathInputAgent, input);
        console.log("&&&", result.isMathQuestion);
        return {
            tripwireTriggered: result.isMathQuestion ? false : true
        }
    }
}
const guardrailAgent = new Agent({
  name: "Homework check",
  instructions: "You are an expert agent",
  inputGuardrails: [mathInputGuardRail],
});

async function main(userInput) {
  const result = await run(guardrailAgent, userInput);
  console.log(result.finalOutput ?? result);
  return result;
}

main("2 + 2 ")
  .catch((error) => {
    console.error("Agent execution failed:", error);
    process.exitCode = 1;
  });