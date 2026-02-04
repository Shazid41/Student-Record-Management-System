
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  analyzePerformance: async (students: Student[]): Promise<string> => {
    if (students.length === 0) return "No student records available for analysis.";

    const studentData = students.map(s => ({
      name: s.name,
      gpa: s.gpa,
      dept: s.department
    }));

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following student GPA data and provide a concise summary (max 100 words) of the overall performance, identifying any notable trends or departments needing attention: ${JSON.stringify(studentData)}`,
        config: {
          temperature: 0.7,
        }
      });

      return response.text || "Unable to generate analysis at this time.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "An error occurred while analyzing student data.";
    }
  }
};
