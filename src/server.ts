import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middleware to parse JSON request bodies
app.use(express.json());

/**
 * Express Rest API endpoints
 */
app.post('/api/generate-content', async (req, res) => {
  try {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY environment variable is not configured. Please add your key in the Secrets panel.' 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const { prompt, category, platform, tone } = req.body;

    const fullPrompt = `You are an expert AI Social Media & Content Planner. Generate highly engaging content based on the following details:
Content Prompt: ${prompt || "Generate a creative content idea"}
Category: ${category || "General"}
Target Platform: ${platform || "Social Media"}
Tone: ${tone || "Engaging & Professional"}

Deliver a complete response containing:
1. An eye-catching TITLE.
2. The complete written BODY (Caption / Script / Text ready to review, with relevant hashtags if appropriate).
3. A short "Visual/Image recommendation" for this post.
4. Two optimal scheduling or post ideas.

Format the sections clearly and separate them using descriptive subheadings so it looks clean.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt,
    });

    return res.json({ text: response.text });
  } catch (err) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error('Gemini content generation error:', err);
    return res.status(500).json({ error: errorDetails || 'Failed to generate content.' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
