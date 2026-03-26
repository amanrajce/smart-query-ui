import type { ModelProvider, CompareResponse } from '../types/index';

const API_URL = 'http://127.0.0.1:5001/api/chat'; // Change to Railway URL in production

export const sendMessageToAI = async (message: string, provider: ModelProvider, role: string = 'doctor') => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, modelProvider: provider, role }), // Added role
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("API Call Error:", error);
        throw new Error("Failed to connect to the SmartQuery Backend.");
    }
};

export const fetchModelComparison = async (prompt: string, role: string = 'doctor'): Promise<CompareResponse> => {
    try {
        const response = await fetch(`${API_URL}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, role }), // Added role
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Compare API Call Error:", error);
        throw new Error("Failed to connect to the AI Judge.");
    }
};