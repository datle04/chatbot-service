# 🤖 FinTrack - AI Financial Advisor Service

This service handles Natural Language Processing (NLP) and generates personalized financial advice for FinTrack users.
It implements a **Hybrid AI Architecture**, leveraging both **Google Gemini** and **Groq** to balance between reasoning capability and response speed.

> **Main Project Repo:** [Frontend](https://github.com/datle04/fintrack-frontend) - [Backend](https://github.com/datle04/fintrack)

## 🧠 How It Works
1.  **Input:** Receives user queries and anonymized financial context (e.g., recent spending data) from the Main Backend.
2.  **Model Selection:** The system selects the appropriate model (Gemini or Groq) based on the complexity of the query or availability.
3.  **Processing:** Constructs optimized prompts to guide the AI model.
4.  **Output:** Returns actionable financial advice, budget tips, or explanations of financial concepts.

## 🛠 Tech Stack
* **Core Models:**
    * **Google Gemini Pro** (via Google Generative AI SDK) - Used for complex financial analysis.
    * **Llama 3 / Mixtral** (via **Groq Cloud**) - Used for instant, high-speed responses.
* **Framework:** Node.js / Express
* **Logic:** Custom Prompt Engineering & Model Fallback Mechanism.

## 🔑 Configuration

### Prerequisites
* Google Cloud Platform Account (Gemini API Key)
* Groq Cloud Account (Groq API Key)

### Environment Variables (.env)
Create a `.env` file in the root directory and add your keys:

```env
FINTRACK_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5000
GEMINI_API_KEY= your_key
GEMINI_API_URL= your_url
GROQ_API_KEY= your_key
JWT_SECRET= your_secret_key
REDIS_URL= your_url
