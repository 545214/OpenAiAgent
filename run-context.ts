import 'dotenv/config'
import { Agent, run, tool, RunContext, retryPolicies } from '@openai/agents'
import { z } from 'zod'

interface MyContext {
  userId: string
  userName: string
  fetchUserInfoFromDb: () => Promise<string>
}

const customerSupportAgent = new Agent<MyContext>({
  name: 'Customer Support Agent',
  instructions: ({ context }) => {
    return `You are an expert customer support agent. Use the provided customer context when answering: userId=${context.userId}, userName=${context.userName}.`
  },
})

const getUserInfoTool = tool({
  name: 'get_user_info',
  description: 'Get the user info',
  parameters: z.object({}),
  execute: async (_, ctx?: RunContext<MyContext>): Promise<string | undefined> => {
    const result=  await ctx?.context?.fetchUserInfoFromDb();
    return result
  },
})

async function main(query: string, ctx: MyContext) {
  const result = await run(customerSupportAgent, query, { context: ctx })

  console.log('Result:', result.finalOutput)
  return result
}

main('Hey what is my name', { userId: '2', userName: 'KartikaSingh', fetchUserInfoFromDb: async() => `UserId=1, UserName=Kartika`})