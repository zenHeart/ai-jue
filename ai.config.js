module.exports = {
  preset: 'base',
  prompts: {
    claude: "Project-specific prompt for Claude: This is an override from ai.config.js.",
    gemini: "Project-specific prompt for Gemini: This is an override from ai.config.js."
  },
  tools: {
    gemini: {
      temperature: 0.9,
      customSetting: "enabled"
    }
  }
};