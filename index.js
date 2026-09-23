import 'dotenv/config'  // this will load the environment variables from the .env file
import {Agent, run} from "@openai/agents"
const agent = new Agent({  
    name: "Hello Agent",
    instructions: "You are a helpful assistant that always says hello world",
 })

 run(agent, "hi my name is kartika").then((response) => {
    console.log(response.finalOutput)
 })