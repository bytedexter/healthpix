import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface ImageAnalysisResult {
  medicines: string[];
  description: string;
  suggestions: string[];
}

export const analyzeImageForMedicines = async (imageFile: File): Promise<ImageAnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert file to base64
    const imageBytes = await fileToGenerativePart(imageFile);

    const prompt = `
      Analyze this image and identify any medicines, prescriptions, or health-related items visible. 
      
      Please provide:
      1. A list of medicine names if any are visible
      2. A brief description of what you see
      3. Suggestions for related medicines or health products
      
      Format your response as JSON:
      {
        "medicines": ["medicine1", "medicine2"],
        "description": "Brief description of what's in the image",
        "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
      }
    `;

    const result = await model.generateContent([prompt, imageBytes]);
    const response = await result.response;
    const text = response.text();

    try {
      // Try to parse as JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
    }

    // Fallback: extract information manually
    return {
      medicines: extractMedicinesFromText(text),
      description: text.substring(0, 200) + '...',
      suggestions: ['Paracetamol', 'Vitamin D3', 'Omega-3']
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
};

export const analyzePrescriptionImage = async (imageFile: File): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageBytes = await fileToGenerativePart(imageFile);

    const prompt = `
      Analyze this prescription image and extract the following information:
      
      1. Patient information (if visible)
      2. Doctor information (if visible)  
      3. List of prescribed medicines with dosages
      4. Instructions for each medicine
      5. Any special notes or warnings
      
      Please format the response clearly and mention if any part is unclear or unreadable.
      Focus on medicine names, dosages, and instructions.
    `;

    const result = await model.generateContent([prompt, imageBytes]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing prescription:', error);
    throw new Error('Failed to analyze prescription. Please try again.');
  }
};

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractMedicinesFromText(text: string): string[] {
  const commonMedicines = [
    'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', 'vitamin d',
    'vitamin c', 'omega-3', 'calcium', 'iron', 'magnesium', 'metformin',
    'lisinopril', 'atorvastatin', 'omeprazole', 'amlodipine'
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  commonMedicines.forEach(medicine => {
    if (lowerText.includes(medicine)) {
      found.push(medicine.charAt(0).toUpperCase() + medicine.slice(1));
    }
  });

  return found;
}
