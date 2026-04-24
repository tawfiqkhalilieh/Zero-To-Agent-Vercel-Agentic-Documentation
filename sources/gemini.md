---
title: Vercel AI Gateway
description: Reference for using Vercel AI Gateway with the AI SDK.
---

# Vercel AI Gateway

The Vercel AI Gateway is the fastest way to get started with the AI SDK. It provides access to models from OpenAI, Anthropic, Google, and other providers through a single API.

## Authentication

Authenticate with OIDC (for Vercel deployments) or an [AI Gateway API key](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway%2Fapi-keys&title=AI+Gateway+API+Keys):

```env filename=".env.local"
AI_GATEWAY_API_KEY=your_api_key_here
```

## Usage

The AI Gateway is the default global provider, so you can access models using a simple string:

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'google/gemini-2.5-flash',
  prompt: 'What is love?',
});
```

You can also explicitly import and use the gateway provider:

```ts
// Option 1: Import from 'ai' package (included by default)
import { gateway } from 'ai';
model: gateway('google/gemini-2.5-flash');

// Option 2: Install and import from '@ai-sdk/gateway' package
import { gateway } from '@ai-sdk/gateway';
model: gateway('google/gemini-2.5-flash');
```

## Find Available Models

**Important**: Always fetch the current model list before writing code. Never use model IDs from memory - they may be outdated.

List all available models through the gateway API:

```bash
curl https://ai-gateway.vercel.sh/v1/models
```

Filter by provider using `jq`. **Do not truncate with `head`** - always fetch the full list to find the latest models:

```bash

# Google models
curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '[.data[] | select(.id | startswith("google/")) | .id] | reverse | .[]'
```


---
title: Common Errors
description: Reference for common AI SDK errors and how to resolve them.
---

# Common Errors

## `maxTokens` → `maxOutputTokens`

```typescript
// ❌ Incorrect
const result = await generateText({
  model: 'gemini-2.5-flash',
  maxTokens: 512, // deprecated: use `maxOutputTokens` instead
  prompt: 'Write a short story',
});

// ✅ Correct
const result = await generateText({
  model: 'gemini-2.5-flash',
  maxOutputTokens: 512,
  prompt: 'Write a short story',
});
```

## `maxSteps` → `stopWhen: isStepCount(n)`

```typescript
// ❌ Incorrect
const result = await generateText({
  model: 'gemini-2.5-flash',
  tools: { weather },
  maxSteps: 5, // deprecated: use `stopWhen: isStepCount(n)` instead
  prompt: 'What is the weather in NYC?',
});

// ✅ Correct
import { generateText, isStepCount } from 'ai';

const result = await generateText({
  model: 'gemini-2.5-flash',
  tools: { weather },
  stopWhen: isStepCount(5),
  prompt: 'What is the weather in NYC?',
});
```

## `parameters` → `inputSchema` (in tool definition)

```typescript
// ❌ Incorrect
const weatherTool = tool({
  description: 'Get weather for a location',
  parameters: z.object({
    // deprecated: use `inputSchema` instead
    location: z.string(),
  }),
  execute: async ({ location }) => ({ location, temp: 72 }),
});

// ✅ Correct
const weatherTool = tool({
  description: 'Get weather for a location',
  inputSchema: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => ({ location, temp: 72 }),
});
```

## `generateObject` → `generateText` with `output`

`generateObject` is deprecated. Use `generateText` with the `output` option instead.

```typescript
// ❌ Deprecated
import { generateObject } from 'ai'; // deprecated: use `generateText` with `output` instead

const result = await generateObject({
  // deprecated function
  model: 'gemini-2.5-flash',
  schema: z.object({
    // deprecated: use `Output.object({ schema })` instead
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a recipe for chocolate cake',
});

// ✅ Correct
import { generateText, Output } from 'ai';

const result = await generateText({
  model: 'gemini-2.5-flash',
  output: Output.object({
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
      }),
    }),
  }),
  prompt: 'Generate a recipe for chocolate cake',
});

console.log(result.output); // typed object
```

## Manual JSON parsing → `generateText` with `output`

```typescript
// ❌ Incorrect
const result = await generateText({
  model: 'gemini-2.5-flash',
  prompt: `Extract the user info as JSON: { "name": string, "age": number }

  Input: John is 25 years old`,
});
const parsed = JSON.parse(result.text);

// ✅ Correct
import { generateText, Output } from 'ai';

const result = await generateText({
  model: 'gemini-2.5-flash',
  output: Output.object({
    schema: z.object({
      name: z.string(),
      age: z.number(),
    }),
  }),
  prompt: 'Extract the user info: John is 25 years old',
});

console.log(result.output); // { name: 'John', age: 25 }
```

## Other `output` options

```typescript
// Output.array - for generating arrays of items
const result = await generateText({
  model: 'gemini-2.5-flash',
  output: Output.array({
    element: z.object({
      city: z.string(),
      country: z.string(),
    }),
  }),
  prompt: 'List 5 capital cities',
});

// Output.choice - for selecting from predefined options
const result = await generateText({
  model: 'anthropic/claude-opus-4.5',
  output: Output.choice({
    options: ['positive', 'negative', 'neutral'] as const,
  }),
  prompt: 'Classify the sentiment: I love this product!',
});

// Output.json - for untyped JSON output
const result = await generateText({
  model: 'gemini-2.5-flash',
  output: Output.json(),
  prompt: 'Return some JSON data',
});
```

## `toDataStreamResponse` → `toUIMessageStreamResponse`

When using `useChat` on the frontend, use `toUIMessageStreamResponse()` instead of `toDataStreamResponse()`. The UI message stream format is designed to work with the chat UI components and handles message state correctly.

```typescript
// ❌ Incorrect (when using useChat)
const result = streamText({
  // config
});

return result.toDataStreamResponse(); // deprecated for useChat: use toUIMessageStreamResponse

// ✅ Correct
const result = streamText({
  // config
});

return result.toUIMessageStreamResponse();
```

## Removed managed input state in `useChat`

The `useChat` hook no longer manages input state internally. You must now manage input state manually.

```tsx
// ❌ Deprecated
import { useChat } from '@ai-sdk/react';

export default function Page() {
  const {
    input, // deprecated: manage input state manually with useState
    handleInputChange, // deprecated: use custom onChange handler
    handleSubmit, // deprecated: use sendMessage() instead
  } = useChat({
    api: '/api/chat', // deprecated: use `transport: new DefaultChatTransport({ api })` instead
  });

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit">Send</button>
    </form>
  );
}

// ✅ Correct
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Page() {
  const [input, setInput] = useState('');
  const { sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const handleSubmit = e => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
}
```

## `tool-invocation` → `tool-{toolName}` (typed tool parts)

When rendering messages with `useChat`, use the typed tool part names (`tool-{toolName}`) instead of the generic `tool-invocation` type. This provides better type safety and access to tool-specific input/output types.

> For end-to-end type-safety, see [Type-Safe Agents](type-safe-agents.md).

Typed tool parts also use different property names:

- `part.args` → `part.input`
- `part.result` → `part.output`

```tsx
// ❌ Incorrect - using generic tool-invocation
{
  message.parts.map((part, i) => {
    switch (part.type) {
      case 'text':
        return <div key={`${message.id}-${i}`}>{part.text}</div>;
      case 'tool-invocation': // deprecated: use typed tool parts instead
        return (
          <pre key={`${message.id}-${i}`}>
            {JSON.stringify(part.toolInvocation, null, 2)}
          </pre>
        );
    }
  });
}

// ✅ Correct - using typed tool parts (recommended)
{
  message.parts.map(part => {
    switch (part.type) {
      case 'text':
        return part.text;
      case 'tool-askForConfirmation':
        // handle askForConfirmation tool
        break;
      case 'tool-getWeatherInformation':
        // handle getWeatherInformation tool
        break;
    }
  });
}

// ✅ Alternative - using isToolUIPart as a catch-all
import { isToolUIPart } from 'ai';

{
  message.parts.map(part => {
    if (part.type === 'text') {
      return part.text;
    }
    if (isToolUIPart(part)) {
      // handle any tool part generically
      return (
        <div key={part.toolCallId}>
          {part.toolName}: {part.state}
        </div>
      );
    }
  });
}
```

## `useChat` state-dependent property access

Tool part properties are only available in certain states. TypeScript will error if you access them without checking state first.

```tsx
// ❌ Incorrect - input may be undefined during streaming
// TS18048: 'part.input' is possibly 'undefined'
if (part.type === 'tool-getWeather') {
  const location = part.input.location;
}

// ✅ Correct - check for input-available or output-available
if (
  part.type === 'tool-getWeather' &&
  (part.state === 'input-available' || part.state === 'output-available')
) {
  const location = part.input.location;
}

// ❌ Incorrect - output is only available after execution
// TS18048: 'part.output' is possibly 'undefined'
if (part.type === 'tool-getWeather') {
  const weather = part.output;
}

// ✅ Correct - check for output-available
if (part.type === 'tool-getWeather' && part.state === 'output-available') {
  const location = part.input.location;
  const weather = part.output;
}
```

## `part.toolInvocation.args` → `part.input`

```tsx
// ❌ Incorrect
if (part.type === 'tool-invocation') {
  // deprecated: use `part.input` on typed tool parts instead
  const location = part.toolInvocation.args.location;
}

// ✅ Correct
if (
  part.type === 'tool-getWeather' &&
  (part.state === 'input-available' || part.state === 'output-available')
) {
  const location = part.input.location;
}
```

## `part.toolInvocation.result` → `part.output`

```tsx
// ❌ Incorrect
if (part.type === 'tool-invocation') {
  // deprecated: use `part.output` on typed tool parts instead
  const weather = part.toolInvocation.result;
}

// ✅ Correct
if (part.type === 'tool-getWeather' && part.state === 'output-available') {
  const weather = part.output;
}
```

## `part.toolInvocation.toolCallId` → `part.toolCallId`

```tsx
// ❌ Incorrect
if (part.type === 'tool-invocation') {
  // deprecated: use `part.toolCallId` on typed tool parts instead
  const id = part.toolInvocation.toolCallId;
}

// ✅ Correct
if (part.type === 'tool-getWeather') {
  const id = part.toolCallId;
}
```

## Tool invocation states renamed

```tsx
// ❌ Incorrect
switch (part.toolInvocation.state) {
  case 'partial-call': // deprecated: use `input-streaming` instead
    return <div>Loading...</div>;
  case 'call': // deprecated: use `input-available` instead
    return <div>Executing...</div>;
  case 'result': // deprecated: use `output-available` instead
    return <div>Done</div>;
}

// ✅ Correct
switch (part.state) {
  case 'input-streaming':
    return <div>Loading...</div>;
  case 'input-available':
    return <div>Executing...</div>;
  case 'output-available':
    return <div>Done</div>;
}
```

## `addToolResult` → `addToolOutput`

```tsx
// ❌ Incorrect
addToolResult({
  // deprecated: use `addToolOutput` instead
  toolCallId: part.toolInvocation.toolCallId,
  result: 'Yes, confirmed.', // deprecated: use `output` instead
});

// ✅ Correct
addToolOutput({
  tool: 'askForConfirmation',
  toolCallId: part.toolCallId,
  output: 'Yes, confirmed.',
});
```

## `messages` → `uiMessages` in `createAgentUIStreamResponse`

```typescript
// ❌ Incorrect
return createAgentUIStreamResponse({
  agent: myAgent,
  messages, // incorrect: use `uiMessages` instead
});

// ✅ Correct
return createAgentUIStreamResponse({
  agent: myAgent,
  uiMessages: messages,
});
```

---
title: AI SDK DevTools
description: Debug AI SDK calls by inspecting captured runs and steps.
---

# AI SDK DevTools

## Why Use DevTools

DevTools captures all AI SDK calls (`generateText`, `streamText`, `ToolLoopAgent`) to a local JSON file. This lets you inspect LLM requests, responses, tool calls, and multi-step interactions without manually logging.

## Setup

Requires AI SDK 6. Install `@ai-sdk/devtools` using your project's package manager.

Wrap your model with the middleware:

```ts
import { wrapLanguageModel, gateway } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const model = wrapLanguageModel({
  model: gateway('google/gemini-2.5-flash'),
  middleware: devToolsMiddleware(),
});
```

## Viewing Captured Data

All runs and steps are saved to:

```
.devtools/generations.json
```

Read this file directly to inspect captured data:

```bash
cat .devtools/generations.json | jq
```

Or launch the web UI:

```bash
npx @ai-sdk/devtools
# Open http://localhost:4983
```

## Data Structure

- **Run**: A complete multi-step interaction grouped by initial prompt
- **Step**: A single LLM call within a run (includes input, output, tool calls, token usage)



---
title: Type-Safe useChat with Agents
description: Build end-to-end type-safe agents by inferring UIMessage types from your agent definition.
---

# Type-Safe useChat with Agents

Build end-to-end type-safe agents by inferring `UIMessage` types from your agent definition for type-safe UI rendering with `useChat`.

## Recommended Structure

```
lib/
  agents/
    my-agent.ts       # Agent definition + type export
  tools/
    weather-tool.ts   # Individual tool definitions
    calculator-tool.ts
```

## Define Tools

```ts
// lib/tools/weather-tool.ts
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ location }) => {
    return { temperature: 72, condition: 'sunny', location };
  },
});
```

## Define Agent and Export Type

```ts
// lib/agents/my-agent.ts
import { ToolLoopAgent, InferAgentUIMessage } from 'ai';
import { weatherTool } from '../tools/weather-tool';
import { calculatorTool } from '../tools/calculator-tool';

export const myAgent = new ToolLoopAgent({
  model: 'anthropic/claude-sonnet-4',
  instructions: 'You are a helpful assistant.',
  tools: {
    weather: weatherTool,
    calculator: calculatorTool,
  },
});

// Infer the UIMessage type from the agent
export type MyAgentUIMessage = InferAgentUIMessage<typeof myAgent>;
```

### With Custom Metadata

```ts
// lib/agents/my-agent.ts
import { z } from 'zod';

const metadataSchema = z.object({
  createdAt: z.number(),
  model: z.string().optional(),
});

type MyMetadata = z.infer<typeof metadataSchema>;

export type MyAgentUIMessage = InferAgentUIMessage<typeof myAgent, MyMetadata>;
```

## Use with `useChat`

```tsx
// app/chat.tsx
import { useChat } from '@ai-sdk/react';
import type { MyAgentUIMessage } from '@/lib/agents/my-agent';

export function Chat() {
  const { messages } = useChat<MyAgentUIMessage>();

  return (
    <div>
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}
```

## Rendering Parts with Type Safety

Tool parts are typed as `tool-{toolName}` based on your agent's tools:

```tsx
function Message({ message }: { message: MyAgentUIMessage }) {
  return (
    <div>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return <p key={i}>{part.text}</p>;

          case 'tool-weather':
            // part.input and part.output are fully typed
            if (part.state === 'output-available') {
              return (
                <div key={i}>
                  Weather in {part.input.location}: {part.output.temperature}F
                </div>
              );
            }
            return <div key={i}>Loading weather...</div>;

          case 'tool-calculator':
            // TypeScript knows this is the calculator tool
            return <div key={i}>Calculating...</div>;

          default:
            return null;
        }
      })}
    </div>
  );
}
```

The `part.type` discriminant narrows the type, giving you autocomplete and type checking for `input` and `output` based on each tool's schema.

## Splitting Tool Rendering into Components

When rendering many tools, you may want to split each tool into its own component. Use `UIToolInvocation<TOOL>` to derive a typed invocation from your tool and export it alongside the tool definition:

```ts
// lib/tools/weather-tool.ts
import { tool, UIToolInvocation } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ location }) => {
    return { temperature: 72, condition: 'sunny', location };
  },
});

// Export the invocation type for use in UI components
export type WeatherToolInvocation = UIToolInvocation<typeof weatherTool>;
```

Then import only the type in your component:

```tsx
// components/weather-tool.tsx
import type { WeatherToolInvocation } from '@/lib/tools/weather-tool';

export function WeatherToolComponent({
  invocation,
}: {
  invocation: WeatherToolInvocation;
}) {
  // invocation.input and invocation.output are fully typed
  if (invocation.state === 'output-available') {
    return (
      <div>
        Weather in {invocation.input.location}: {invocation.output.temperature}F
      </div>
    );
  }
  return <div>Loading weather for {invocation.input?.location}...</div>;
}
```

Use the component in your message renderer:

```tsx
function Message({ message }: { message: MyAgentUIMessage }) {
  return (
    <div>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return <p key={i}>{part.text}</p>;
          case 'tool-weather':
            return <WeatherToolComponent key={i} invocation={part} />;
          case 'tool-calculator':
            return <CalculatorToolComponent key={i} invocation={part} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```
