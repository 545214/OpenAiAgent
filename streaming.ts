import 'dotenv/config'
import { Agent, run } from '@openai/agents'

const agent = new Agent({
  name: 'Story Teller Agent',
  instructions: 'You are a storyteller. You will be given topic and you will write a story about it',
})

async function* streamOutput(q: string) {
  const result= await run(agent, q, {stream: true})
  const stream = result.toTextStream()
  for await(const val of stream) {
    yield{isCompleted: false, value: val}
  }
  yield{isCompleted: true, value: result.finalOutput}
}

async function main(q: string) {
    for await(const o of streamOutput(q)) {
      console.log(o)
    }
}
main("Write a story about macbook")