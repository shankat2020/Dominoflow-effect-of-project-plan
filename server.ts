import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API endpoint to parse unstructured project charter / plan
app.post('/api/parse-charter', async (req, res) => {
  try {
    const { charterText, projectNameHint, startDateHint } = req.body;

    if (!charterText || typeof charterText !== 'string' || !charterText.trim()) {
      return res.status(400).json({ error: 'charterText is required' });
    }

    if (!ai) {
      // Fallback if no Gemini API key configured
      return res.status(200).json({
        fallback: true,
        message: 'No Gemini API key available. Use local structured parsing.',
      });
    }

    const prompt = `Analyze the following project charter, statement of work, or project plan and extract a realistic, cohesive domino-timeline breakdown with 4 to 8 tasks across 3 to 5 parallel swimlanes.
Ensure:
1. Tasks have realistic durations (between 2 and 12 days).
2. Prerequisites (dependsOn) are logical so there is a clear flow and some tasks have natural buffer cushions before subsequent tasks or the final launch.
3. Each task belongs to a swimlane (e.g., 'design', 'engineering', 'infrastructure', 'qa_security', 'gtm_ops').
4. Include realistic team owner personas with initials.

Project Charter Content:
"""
${charterText}
"""
${projectNameHint ? `Project Name Hint: "${projectNameHint}"` : ''}
${startDateHint ? `Start Date Hint: "${startDateHint}"` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert technical project management director. Extract a structured domino timeline with parallel swimlanes, tasks, realistic durations (2-10 days), logical prerequisite dependencies, and buffer-friendly sequencing.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: {
              type: Type.STRING,
              description: 'Clear, concise name of the project',
            },
            projectDescription: {
              type: Type.STRING,
              description: 'One-sentence summary of project charter goals',
            },
            startDate: {
              type: Type.STRING,
              description: 'Estimated start date in YYYY-MM-DD format (default Nov 2026 if unspecified)',
            },
            swimlanes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Slug id, e.g. design, backend, qa' },
                  name: { type: Type.STRING, description: 'Human readable swimlane title' },
                  category: { type: Type.STRING, description: 'Discipline or department' },
                  iconName: { 
                    type: Type.STRING, 
                    description: 'One of: palette, server, code, shield-check, rocket, cpu' 
                  },
                },
                required: ['id', 'name', 'category'],
              },
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique task id like task-1, task-2' },
                  name: { type: Type.STRING, description: 'Actionable deliverable title' },
                  swimlaneId: { type: Type.STRING, description: 'Matches one of the swimlane IDs' },
                  duration: { type: Type.INTEGER, description: 'Estimated duration in days (2 to 14)' },
                  dependsOn: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'IDs of prerequisite tasks that must complete first',
                  },
                  owner: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      role: { type: Type.STRING },
                      avatar: { type: Type.STRING, description: '2 letter initials' },
                    },
                    required: ['name', 'role', 'avatar'],
                  },
                  description: { type: Type.STRING },
                },
                required: ['id', 'name', 'swimlaneId', 'duration', 'dependsOn', 'owner'],
              },
            },
          },
          required: ['projectName', 'projectDescription', 'startDate', 'swimlanes', 'tasks'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, project: parsedJson });
  } catch (error: any) {
    console.error('Error parsing charter with Gemini:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse charter' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!apiKey });
});

// Vite Middleware for Dev / Static files for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DominoFlow server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
