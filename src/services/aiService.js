import Groq from "groq-sdk";

// Initialize the Groq client directly on the client side
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, 
});

export const askAI = async (formattedMessages) => {
  try {
    const response = await groq.chat.completions.create({
      // Llama-3.3-70b is highly accurate, fast, and completely free to use
      model: "llama-3.3-70b-versatile", 
      messages: [
        {
          role: "system",
          content: "You are Edith, a helpful AI assistant. Help the people who ask you questions to the best of your ability. Always try to provide accurate and concise answers. If you don't know the answer, say you don't know. Be friendly and helpful!",
        },
        ...formattedMessages, 
      ],
    });

    console.log("Groq API Response:", response);
    return response.choices[0]?.message?.content || "No response generated.";

  } catch (error) {
    console.error("Groq Frontend Error:", error.message || error);
    return "Error connecting to Edith's Groq core.";
  }
};