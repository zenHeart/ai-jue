// packages/jue-preset-base/src/index.ts
const config = {
  prompts: {
    claude: "As an AI assistant, prioritize helpfulness and safety. Analyze code for best practices, clarity, and efficiency.",
    gemini: "As a Gemini AI, provide concise and accurate information. Focus on technical details and robust solutions."
  },
  skills: {
    codeReview: "Perform a comprehensive code review focusing on logic, maintainability, and security.",
    explainCode: "Explain the provided code snippet step-by-step, including its purpose and functionality."
  }
};

export = config;