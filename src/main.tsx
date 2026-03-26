import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes' // 🌙 SENIOR FIX: Import the dark theme

// Import your publishable key securely
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Did you add it to .env.local?")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#2563EB', // Tailwind blue-600 to match your buttons
          colorBackground: '#1A1A1A', // Matches your sidebar/cards
          colorInputBackground: '#2F2F2F', // Matches your text areas
          colorInputText: '#ECECEC',
          colorTextOnPrimaryBackground: '#FFFFFF',
          borderRadius: '0.75rem', // Smooth rounded corners
        },
        elements: {
          card: "border border-[#3E3E3E] shadow-2xl", // Matches your app borders
          headerTitle: "text-[#ECECEC]",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: "border border-[#3E3E3E] hover:bg-[#2A2A2A] text-gray-300",
          dividerLine: "bg-[#3E3E3E]",
          dividerText: "text-gray-500",
          formFieldLabel: "text-gray-300",
          formFieldInput: "border-[#3E3E3E] focus:border-blue-500 text-[#ECECEC]",
          footerActionText: "text-gray-400",
          footerActionLink: "text-blue-500 hover:text-blue-400"
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)