#!/usr/bin/env node
/**
 * MCP Server for DeepSeek AI API
 * Integrates DeepSeek models with Antigravity IDE via Model Context Protocol
 * 
 * DeepSeek API is OpenAI-compatible, so we use the openai SDK with custom baseURL.
 * 
 * Setup:
 *   1. Set DEEPSEEK_API_KEY environment variable
 *   2. Register this server in your MCP config
 *   3. Use deepseek_chat or deepseek_code tools in Antigravity
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import OpenAI from "openai";

// ─── DeepSeek Client (OpenAI-compatible) ─────────────────────────────────────
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com/v1",
});

// ─── Available DeepSeek Models ────────────────────────────────────────────────
const DEEPSEEK_MODELS = {
  chat: "deepseek-chat",          // DeepSeek-V3: General purpose chat
  reasoner: "deepseek-reasoner",  // DeepSeek-R1: Advanced reasoning / coding
};

// ─── MCP Server Setup ─────────────────────────────────────────────────────────
const server = new McpServer({
  name: "deepseek",
  version: "1.0.0",
});

// ─── Tool: deepseek_chat ──────────────────────────────────────────────────────
server.tool(
  "deepseek_chat",
  "Send a message to DeepSeek-V3 (deepseek-chat) for general tasks, content generation, analysis, and conversation. Best for everyday AI tasks.",
  {
    message: z.string().describe("The message or prompt to send to DeepSeek"),
    system_prompt: z.string().optional().describe("Optional system prompt to set the AI's behavior or role"),
    temperature: z.number().min(0).max(2).optional().default(0.7).describe("Creativity level: 0=deterministic, 1=balanced, 2=creative"),
    max_tokens: z.number().min(1).max(8192).optional().default(4096).describe("Maximum tokens in the response"),
  },
  async ({ message, system_prompt, temperature, max_tokens }) => {
    if (!process.env.DEEPSEEK_API_KEY) {
      return {
        content: [{
          type: "text",
          text: "❌ ERROR: DEEPSEEK_API_KEY environment variable is not set.\n\nPlease set it in your MCP config:\n```json\n\"env\": { \"DEEPSEEK_API_KEY\": \"your-api-key-here\" }\n```",
        }],
        isError: true,
      };
    }

    try {
      const messages = [];
      if (system_prompt) {
        messages.push({ role: "system", content: system_prompt });
      }
      messages.push({ role: "user", content: message });

      const response = await client.chat.completions.create({
        model: DEEPSEEK_MODELS.chat,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
      });

      const reply = response.choices[0]?.message?.content ?? "(No response)";
      const usage = response.usage;

      return {
        content: [{
          type: "text",
          text: `🤖 **DeepSeek-V3 Response**\n\n${reply}\n\n---\n📊 *Tokens: ${usage?.prompt_tokens ?? 0} input → ${usage?.completion_tokens ?? 0} output (${usage?.total_tokens ?? 0} total)*`,
        }],
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `❌ DeepSeek API Error: ${errMsg}`,
        }],
        isError: true,
      };
    }
  }
);

// ─── Tool: deepseek_code ──────────────────────────────────────────────────────
server.tool(
  "deepseek_code",
  "Use DeepSeek-R1 (deepseek-reasoner) for complex coding tasks, debugging, algorithm design, and multi-step reasoning. This is DeepSeek's most powerful model.",
  {
    task: z.string().describe("The coding task, question, or problem to solve"),
    language: z.string().optional().describe("Programming language (e.g. TypeScript, Python, PHP, JavaScript)"),
    context: z.string().optional().describe("Additional code context, existing code, or constraints to consider"),
    max_tokens: z.number().min(1).max(16384).optional().default(8192).describe("Maximum tokens in the response"),
  },
  async ({ task, language, context, max_tokens }) => {
    if (!process.env.DEEPSEEK_API_KEY) {
      return {
        content: [{
          type: "text",
          text: "❌ ERROR: DEEPSEEK_API_KEY environment variable is not set.",
        }],
        isError: true,
      };
    }

    try {
      const systemPrompt = [
        "You are an expert software engineer and coding assistant.",
        language ? `You are working with ${language}.` : "",
        "Provide clean, well-commented, production-ready code.",
        "Explain your reasoning step by step when solving complex problems.",
        "Always mention potential edge cases and best practices.",
      ].filter(Boolean).join(" ");

      const userMessage = [
        context ? `## Existing Code/Context\n\`\`\`\n${context}\n\`\`\`\n\n` : "",
        `## Task\n${task}`,
      ].filter(Boolean).join("");

      const response = await client.chat.completions.create({
        model: DEEPSEEK_MODELS.reasoner,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: max_tokens ?? 8192,
      });

      const reply = response.choices[0]?.message?.content ?? "(No response)";
      const reasoning = response.choices[0]?.message?.reasoning_content;
      const usage = response.usage;

      let output = `🧠 **DeepSeek-R1 (Reasoner) Response**`;
      if (language) output += ` — ${language}`;
      output += `\n\n`;

      if (reasoning) {
        output += `<details>\n<summary>💭 Chain of Thought (click to expand)</summary>\n\n${reasoning}\n\n</details>\n\n`;
      }

      output += reply;
      output += `\n\n---\n📊 *Tokens: ${usage?.prompt_tokens ?? 0} input → ${usage?.completion_tokens ?? 0} output (${usage?.total_tokens ?? 0} total)*`;

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `❌ DeepSeek API Error: ${errMsg}`,
        }],
        isError: true,
      };
    }
  }
);

// ─── Tool: deepseek_analyze ───────────────────────────────────────────────────
server.tool(
  "deepseek_analyze",
  "Analyze code, text, data or documents using DeepSeek-V3. Use for code review, security analysis, performance optimization, or content analysis.",
  {
    content: z.string().describe("The content to analyze (code, text, data, etc.)"),
    analysis_type: z.enum([
      "code_review",
      "security_audit",
      "performance_optimization",
      "bug_detection",
      "documentation",
      "general_analysis",
    ]).optional().default("general_analysis").describe("Type of analysis to perform"),
    focus: z.string().optional().describe("Specific aspect to focus on during analysis"),
  },
  async ({ content, analysis_type, focus }) => {
    if (!process.env.DEEPSEEK_API_KEY) {
      return {
        content: [{
          type: "text",
          text: "❌ ERROR: DEEPSEEK_API_KEY environment variable is not set.",
        }],
        isError: true,
      };
    }

    const analysisPrompts = {
      code_review: "Perform a thorough code review. Check for: code quality, readability, maintainability, adherence to best practices, potential bugs, and improvements.",
      security_audit: "Perform a security audit. Identify: vulnerabilities, injection risks, authentication issues, data exposure risks, and security best practices violations.",
      performance_optimization: "Analyze for performance. Identify: bottlenecks, inefficient algorithms, memory leaks, unnecessary re-renders, and suggest optimizations.",
      bug_detection: "Find potential bugs, logical errors, edge cases not handled, null pointer risks, and race conditions.",
      documentation: "Generate comprehensive documentation: explain what the code does, document functions/methods/classes, list parameters and return values.",
      general_analysis: "Provide a comprehensive analysis covering quality, correctness, potential issues, and suggestions.",
    };

    const systemPrompt = `You are an expert code and content analyst. ${analysisPrompts[analysis_type ?? "general_analysis"]}${focus ? ` Focus specifically on: ${focus}.` : ""}`;

    try {
      const response = await client.chat.completions.create({
        model: DEEPSEEK_MODELS.chat,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze the following:\n\n\`\`\`\n${content}\n\`\`\`` },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const reply = response.choices[0]?.message?.content ?? "(No response)";
      const typeLabel = (analysis_type ?? "general_analysis").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

      return {
        content: [{
          type: "text",
          text: `🔍 **DeepSeek Analysis — ${typeLabel}**\n\n${reply}`,
        }],
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `❌ DeepSeek API Error: ${errMsg}`,
        }],
        isError: true,
      };
    }
  }
);

// ─── Tool: deepseek_models ────────────────────────────────────────────────────
server.tool(
  "deepseek_models",
  "List available DeepSeek models and their capabilities. Use to understand which model to use for different tasks.",
  {},
  async () => {
    const apiKeyStatus = process.env.DEEPSEEK_API_KEY ? "✅ Set" : "❌ Not set";
    
    return {
      content: [{
        type: "text",
        text: `# DeepSeek MCP Server — Available Models

## 🔑 API Key Status: ${apiKeyStatus}

## Available Models

| Model ID | Tool | Best For |
|----------|------|----------|
| \`deepseek-chat\` (DeepSeek-V3) | \`deepseek_chat\` | General chat, content creation, Q&A, analysis |
| \`deepseek-reasoner\` (DeepSeek-R1) | \`deepseek_code\` | Complex coding, math, multi-step reasoning |

## Available Tools

### \`deepseek_chat\`
General-purpose AI assistant powered by DeepSeek-V3.
- ✅ Conversation & Q&A
- ✅ Content generation & editing
- ✅ Summarization & translation
- ✅ Simple coding tasks

### \`deepseek_code\`  
Advanced reasoning engine powered by DeepSeek-R1.
- ✅ Complex algorithms & data structures
- ✅ Debugging & root cause analysis
- ✅ Architecture design
- ✅ Mathematical proofs
- ✅ Shows chain-of-thought reasoning

### \`deepseek_analyze\`
Code and content analyzer powered by DeepSeek-V3.
- ✅ Code review
- ✅ Security audit
- ✅ Performance optimization
- ✅ Bug detection
- ✅ Documentation generation

## Pricing (as of 2025)
- DeepSeek-V3: ~$0.27/M input tokens, $1.10/M output tokens
- DeepSeek-R1: ~$0.55/M input tokens, $2.19/M output tokens

## Links
- Platform: https://platform.deepseek.com
- API Docs: https://api-docs.deepseek.com
`,
      }],
    };
  }
);

// ─── Start Server ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("✅ DeepSeek MCP Server running — Tools: deepseek_chat, deepseek_code, deepseek_analyze, deepseek_models");
