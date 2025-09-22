// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gemini-2.5-flash";

if (!GEMINI_KEY) {
  console.error("ERROR: Set GEMINI_API_KEY in your .env file and restart.");
  process.exit(1);
}

// Create client
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("GenAI Prompt-to-Code API is running. POST /api/generate { prompt }");
});

/**
 * POST /api/generate
 * Body: { prompt: "Write a JS function to reverse a string", model?: "gemini-2.5-flash" }
 * Response: { generated: "..." }
 */
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const chosenModel = model || DEFAULT_MODEL;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Build contents — instruct model to return code only and include language if desired
    // Example developer prompt: "Return only the code inside triple backticks. Language: javascript"
    const contents = typeof prompt === "string" ? prompt : String(prompt);

    console.log("Calling Gemini model:", chosenModel);

    // Call Gemini via the official SDK (sample usage from the SDK)
    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: contents,
      // If the SDK supports additional options (temperature, max tokens), add them here.
      // e.g., safetySettings or advanced parameters depending on the SDK version.
    });

    // SDK sample returns `response.text` (as in your example). Fallback to JSON stringify.
    const generatedText = (response && (response.text || response.output || JSON.stringify(response))) ?? "";

    return res.json({ generated: generatedText });
  } catch (err) {
    console.error("Generation error:", err?.response ?? err);
    // Try to return useful debug info without leaking secrets
    const details = (err && err.message) ? err.message : err;
    return res.status(500).json({ error: "Generation failed", details });
  }
});

// Static response
// const staticResponse = {
//   generated: `You can reverse a string in JavaScript using several methods. Here are a few common approaches, from the most concise to more manual implementations:

// ---

// ### Method 1: Using \`split()\`, \`reverse()\`, and \`join()\` (Most Common & Concise)

// This is often considered the most "JavaScripty" way due to its elegance and readability.

// \`\`\`javascript
// function reverseStringBuiltIn(str) {
//   return str.split('').reverse().join('');
// }
// console.log(reverseStringBuiltIn("hello")); // olleh
// \`\`\`

// ---

// ### Method 2: Using a \`for\` loop (Iterating backwards)

// \`\`\`javascript
// function reverseStringLoopBackwards(str) {
//   let reversed = '';
//   for (let i = str.length - 1; i >= 0; i--) {
//     reversed += str[i];
//   }
//   return reversed;
// }
// console.log(reverseStringLoopBackwards("world")); // dlrow
// \`\`\`

// ---
// `,
// };

// // API endpoint
// app.get("/api/generate", (req, res) => {
//   res.json(staticResponse);
// });


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
