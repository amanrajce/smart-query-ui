import type { ModelProvider, CompareResponse } from '../types/index';

// 🧰 SENIOR FIX: Hardcoded the exact Render URL to completely bypass Vercel env variable issues.
const BASE_URL = 'https://smart-query-backend-6s62.onrender.com';
const API_URL = `${BASE_URL}/api/chat`;

export const sendMessageToAI = async (message: string, provider: ModelProvider, role: string = 'doctor') => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, modelProvider: provider, role }), 
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