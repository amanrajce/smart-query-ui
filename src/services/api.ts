import type { ModelProvider, CompareResponse } from '../types/index';

const API_URL = 'http://127.0.0.1:5001/api/chat';

export const sendMessageToAI = async (message: string, provider: ModelProvider) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, modelProvider: provider }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("API Call Error:", error);
        throw new Error("Failed to connect to the SmartQuery Backend.");
    }
};

// NEW: Dedicated function for the Compare & Judge feature
export const fetchModelComparison = async (prompt: string): Promise<CompareResponse> => {
    try {
        const response = await fetch(`${API_URL}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Compare API Call Error:", error);
        throw new Error("Failed to connect to the AI Judge.");
    }
};