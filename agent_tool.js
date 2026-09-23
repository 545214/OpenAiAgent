import 'dotenv/config' 
import {Agent, run, tool} from "@openai/agents"
import { z } from "zod";
import axios from "axios";

const GetWeatherResponseSchema = z.object({
  city: z.string().describe("The city for which the weather is being requested."),
  temperature: z.string().describe("The current temperature in the city."),
  condition: z.string().optional().describe("The current weather condition in the city."),
});

const getWeatherTool= tool({
  name: "get_weather",
  description: "Get the current weather for a given city.",
  parameters: z.object({ city: z.string().describe("The city to get the weather for.") }),
  execute: async function({ city }) {
   const url= `https://wttw.wttr.in/${city.toLowerCase()}?format=%C+%t`;
   const response = await axios.get(url);
   console.log("&&&",response.data);
    return `The weather in ${city} is ${response.data}`;
  }
   
})

const sendEmailTool= tool({
  name: "send_email",
  description: "Send an email to a given recipient.", 
  parameters: z.object({ 
    recipient: z.string().describe("The email address of the recipient."),
    subject: z.string().describe("The subject of the email."),
    body: z.string().describe("The body of the email.")
  }),
  execute: async function({ recipient, subject, body }) {
   return `Email sent to ${recipient} with subject "${subject}" and body "${body}"`;
  }
})
const agent = new Agent({  
    name: "Weather  Agent",
  instructions: "You are an expert weather agent. When the user provides a city, call the get_weather tool and return its result. Ask for a city only when the user has not provided one. Also, when the user asks to send an email, call the send_email tool with the provided recipient, subject, and body. If the user does not provide all the required parameters for sending an email, ask for them.",
    tools: [getWeatherTool, sendEmailTool],
    outputType: GetWeatherResponseSchema,
 })

 async function main(query= '') {
    const response = await run(agent, query);
    console.log(response.finalOutput);
    return response.finalOutput;
 }

 main("What is the weather in Goa? I need only the temperature and condition for each city. Please provide the information in a structured format.")
 main("Send an email to Vaibhav@gmail.com with subject 'weather' and body 'Send me the weather report for Delhi, Goa and Mumbai'")