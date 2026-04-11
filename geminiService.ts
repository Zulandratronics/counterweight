
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, GroundingSource } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeText(text: string): Promise<AnalysisResult> {
    const prompt = `
      You are an expert logician, debate champion, and investigative researcher. 
      Analyze the following text with brutal intellectual honesty and rigor.
      
      Your analysis must include:
      1. LOGICAL FALLACIES: Identify any informal or formal fallacies (e.g., strawman, ad hominem, slippery slope).
      2. INCONSISTENCIES: Point out where the text contradicts itself.
      3. FACTUAL ACCURACY: Use Google Search to verify empirical claims.
      4. COUNTER-ARGUMENT: Provide a steel-manned, intellectually mature counterpoint that addresses the strongest version of their argument.
      5. LOGIC SCORE: A score from 0 to 100 representing the overall structural integrity of the argument.

      TEXT TO ANALYZE:
      "${text}"

      IMPORTANT: 
      - If you use Google Search grounding, mention specific facts.
      - Return your findings in a clear, structured Markdown format with these exact headings: 
        ### Fallacies
        ### Inconsistencies
        ### Fact Checks
        ### Counter-Argument
        ### Logic Score
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text || "Analysis failed to generate.";
      
      // Extract grounding sources
      const sources: GroundingSource[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || 'Source',
              uri: chunk.web.uri
            });
          }
        });
      }

      // We'll parse the structured text manually in the UI for display
      return {
        fallacies: [], // We will extract these from the text or present the raw text
        inconsistencies: [],
        factChecks: [],
        counterArgument: "",
        logicScore: this.extractLogicScore(responseText),
        sources: Array.from(new Map(sources.map(s => [s.uri, s])).values()), // Dedup sources
        rawResponse: responseText,
      };
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }

  private extractLogicScore(text: string): number {
    const match = text.match(/Logic Score[:\s]+(\d+)/i);
    return match ? parseInt(match[1], 10) : 50;
  }
}
