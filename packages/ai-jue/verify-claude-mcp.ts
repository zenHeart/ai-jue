import path from "path";
import fs from "fs";
import { generate as generateClaude } from "../ai-jue-adapter-claude/src/index";

async function verifyClaudeMcp() {
  const outputDir = path.join(__dirname, "test-output-mcp");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const config = {
    language: "en",
    mcp: {
      servers: {
        "sqlite-mcp": {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-sqlite",
            "--db",
            "test.db",
          ],
          env: {
            DEBUG: "mcp:*",
          },
        },
      },
    },
  };

  console.log("Generating Claude MCP configuration...");
  await generateClaude(config, outputDir);

  const mcpFilePath = path.join(outputDir, ".mcp.json");
  if (fs.existsSync(mcpFilePath)) {
    const mcpContent = JSON.parse(fs.readFileSync(mcpFilePath, "utf8"));
    console.log("Verifying .mcp.json content...");
    if (mcpContent.mcpServers && mcpContent.mcpServers["sqlite-mcp"]) {
      console.log("✅ .mcp.json generated correctly with sqlite-mcp");
    } else {
      console.error(
        "❌ .mcp.json does not contain expected server configuration",
      );
      process.exit(1);
    }
  } else {
    console.error("❌ .mcp.json was not generated");
    process.exit(1);
  }

  console.log("Clearing test output...");
  // fs.rmSync(outputDir, { recursive: true, force: true });
}

verifyClaudeMcp().catch((err) => {
  console.error(err);
  process.exit(1);
});
