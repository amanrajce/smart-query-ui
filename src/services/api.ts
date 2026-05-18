import type { ModelProvider, CompareResponse } from '../types/index';

// 🧰 SENIOR FIX: Use environment variables so you never have to hardcode the backend URL again.
// It will fallback to localhost during local development.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/chat'; 

export const sendMessageToAI = async (message: string, provider: ModelProvider, role: string = 'doctor') => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, modelProvider: provider, role }), // Preserved your exact backend payload keys
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
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
            body: JSON.stringify({ prompt, role }), 
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Compare API Call Error:", error);
        throw new Error("Failed to connect to the AI Judge.");
    }
};