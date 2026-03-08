/**
 * Accurate Token Counter using tiktoken and Anthropic tokenizer
 *
 * Based on best practices from:
 * - OpenAI tiktoken: https://github.com/openai/tiktoken
 * - Anthropic tokenizer: https://github.com/anthropics/anthropic-tokenizer-typescript
 * - Toktrack: https://github.com/mag123c/toktrack
 */

import { get_encoding, encoding_for_model } from 'tiktoken';
import { countTokens as countAnthropicTokens } from '@anthropic-ai/tokenizer';

export class TokenCounter {
  /**
   * Count tokens for OpenAI models (GPT-4, GPT-3.5, etc.)
   */
  static countOpenAITokens(text: string, model: string = 'gpt-4o'): number {
    try {
      const encoding = encoding_for_model(model as any);
      const tokens = encoding.encode(text);
      const count = tokens.length;
      encoding.free(); // Important: free the encoding after use
      return count;
    } catch (error) {
      // Fallback to cl100k_base encoding (used by GPT-4 and GPT-3.5-turbo)
      const encoding = get_encoding('cl100k_base');
      const tokens = encoding.encode(text);
      const count = tokens.length;
      encoding.free();
      return count;
    }
  }

  /**
   * Count tokens for Anthropic Claude models
   * Note: This is an approximation. Use API usage field for accurate counts.
   */
  static countClaudeTokens(text: string): number {
    try {
      return countAnthropicTokens(text);
    } catch (error) {
      // Fallback: estimate 1 token ≈ 4 characters
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Count tokens for chat messages (OpenAI format)
   */
  static countMessageTokens(
    messages: Array<{ role: string; content: string }>,
    model: string = 'gpt-4o'
  ): number {
    try {
      const encoding = encoding_for_model(model as any);

      let numTokens = 0;

      // Every message follows <im_start>{role/name}\n{content}<im_end>\n
      for (const message of messages) {
        numTokens += 4; // every message has 4 tokens overhead
        numTokens += encoding.encode(message.role).length;
        numTokens += encoding.encode(message.content).length;
      }
      numTokens += 2; // every reply is primed with <im_start>assistant

      encoding.free();
      return numTokens;
    } catch (error) {
      // Fallback: estimate based on total text length
      const totalText = messages.map(m => m.content).join(' ');
      return Math.ceil(totalText.length / 4);
    }
  }

  /**
   * Estimate code tokens (useful for Cursor/Copilot)
   * Based on research: avg 350 code tokens per generation
   */
  static estimateCodeTokens(linesOfCode: number, language: string = 'typescript'): {
    input: number;
    output: number;
  } {
    // Average prompt for code generation: 200 tokens
    // Average code output: ~3-5 tokens per line
    const inputTokens = 200;
    const tokensPerLine = language === 'python' ? 4 : 3.5;
    const outputTokens = Math.ceil(linesOfCode * tokensPerLine);

    return {
      input: inputTokens,
      output: outputTokens
    };
  }

  /**
   * Estimate conversation tokens from file size
   */
  static estimateFromFileSize(fileSizeBytes: number): {
    input: number;
    output: number;
  } {
    // Average conversation: ~50% input, ~50% output
    // Estimate: 1 byte ≈ 0.25 tokens (conservative)
    const totalTokens = Math.ceil(fileSizeBytes * 0.25);
    return {
      input: Math.floor(totalTokens * 0.5),
      output: Math.ceil(totalTokens * 0.5)
    };
  }

  /**
   * Parse API response usage field
   */
  static parseAPIUsage(usage: any): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  } {
    return {
      inputTokens: usage.input_tokens || usage.prompt_tokens || 0,
      outputTokens: usage.output_tokens || usage.completion_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0
    };
  }
}
