import type { ModelProvider, CompareResponse } from '../types/index';

// 🛠️ SENIOR FIX: Dynamic Environment Routing
// Vite uses `import.meta.env` to inject cloud variables during the build.
// If VITE_API_URL exists (Vercel), it uses that. If not (Localhost), it defaults to 5001.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

export const sendMessageToAI = async (message: string, provider: ModelProvider) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
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

// Dedicated function for the Compare & Judge feature
export const fetchModelComparison = async (prompt: string): Promise<CompareResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/compare`, {
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
