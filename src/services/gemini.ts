import { GoogleGenAI, Type } from "@google/genai";

// This is the "brain" initialization. We get the API key from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// This "Interface" is just a blueprint of what we expect the AI to send back.
// It ensures our code knows exactly what data it's dealing with.
export interface AnalysisResult {
  subject: string;
  topics: { name: string; frequency: number; importance: number }[];
  repeatedQuestions: string[];
  predictions: { topic: string; probability: number; reasoning: string }[];
  mockExam: {
    title: string;
    sections: { title: string; questions: string[] }[];
  };
  studyNotes: { topic: string; keyPoints: string[] }[];
  confidenceScore: number;
}

/**
 * This is the main function that processes the analysis.
 * It takes a list of files (as base64 strings) and identifies patterns.
 */
export async function analyzeExamPaper(files: { base64: string; mimeType: string }[]): Promise<AnalysisResult> {
  // We use one of the newest and most efficient models.
  const model = "gemini-3-flash-preview";
  
  // Safety check: If there's no API key, the app won't work, so we stop here.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing configuration. Please check your system settings.");
  }

  // This is the processing logic. It sets the rules for the analysis.
  const systemInstruction = `
    You are an expert academic assistant and expert examiner specializing in NATIONAL EXAM preparation.
    The user is preparing for high-stakes national exams and wants to achieve EXCELLENT grades.
    
    HOW TO ANALYZE:
    1. Read everything. Identify the common subject.
    2. Count topic frequency and detected repeated questions.
    3. PREDICTION LOGIC: Predict what is likely to come up next based on patterns.
    
    NEW REQUIREMENTS:
    4. GENERATE A MOCK EXAM: Based on the patterns, create a structured "Predicted Mock Exam". 
       - It should have realistic sections (e.g., Section A: MCQ, Section B: Long Answers).
       - The questions should be ORIGINAL but based on the frequent topics and styles of the uploaded papers.
       - Focus on the difficulty level typical of National Exams.
    5. GENERATE STUDY NOTES: Provide short, focused study notes for the MOST FREQUENT topics identified.
       - Focus on the "Core Pillars"—topics that appear across multiple years.
       - Each topic should have 3-5 key points or concepts to learn.
       - Focus on concepts that are traditionally "score-boosters" in national exams.
    
    IMPORTANT: You are calculating probabilities, not seeing the future. 
    Be honest about your confidence score. Emphasize that thorough preparation is key to top grades.
  `;

  // We convert the file data into a format the Gemini AI understands.
  const fileParts = files.map(file => ({
    inlineData: {
      data: file.base64,
      mimeType: file.mimeType || 'application/pdf',
    },
  }));

  try {
    // This is the actual request.
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          ...fileParts,
          { text: "Identify patterns in these papers. Then, generate a Predicted Mock Exam and Study Notes based on your findings. Respond in JSON." },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  frequency: { type: Type.NUMBER },
                  importance: { type: Type.NUMBER }
                },
                required: ["name", "frequency", "importance"]
              }
            },
            repeatedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["topic", "probability", "reasoning"]
              }
            },
            mockExam: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                sections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      questions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "questions"]
                  }
                }
              },
              required: ["title", "sections"]
            },
            studyNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["topic", "keyPoints"]
              }
            },
            confidenceScore: { type: Type.NUMBER }
          },
          required: [
            "subject", "topics", "repeatedQuestions", "predictions", 
            "mockExam", "studyNotes", "confidenceScore"
          ]
        }
      },
    });

    // If the system somehow returns nothing, we throw an error.
    if (!response.text) {
      throw new Error("No data returned. Try using a clearer file.");
    }

    // Convert the response back into a Javascript Object.
    return JSON.parse(response.text);

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    
    // We translate technical errors into "Human" errors.
    if (error.message?.includes("429")) {
      throw new Error("We're sending too many requests. Wait a minute and try again.");
    }
    
    throw new Error("Failed to read the papers. Make sure they are readable PDFs or Images.");
  }
}
