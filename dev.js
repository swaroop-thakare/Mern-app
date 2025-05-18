const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    log(`Creating directory: ${dirPath}`, colors.yellow);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function updateEnvFile(port) {
  const envPath = path.join(__dirname, ".env.local");
  const envContent = `NEXT_PUBLIC_API_URL=http://localhost:${port}/api\n`;
  fs.writeFileSync(envPath, envContent);
  log(`✅ Updated .env.local with API URL: http://localhost:${port}/api`, colors.green);
}

function waitForPortFile() {
  return new Promise((resolve) => {
    const portFilePath = path.join(__dirname, "port.txt");
    const checkInterval = 100;
    const maxWaitTime = 30000;
    let elapsedTime = 0;

    log("⏳ Waiting for server to start and write port.txt...", colors.yellow);

    const interval = setInterval(() => {
      if (fs.existsSync(portFilePath)) {
        clearInterval(interval);
        const port = fs.readFileSync(portFilePath, "utf8").trim();
        log(`✅ Server started on port ${port}`, colors.green);
        resolve(port);
      } else {
        elapsedTime += checkInterval;
        if (elapsedTime >= maxWaitTime) {
          clearInterval(interval);
          log("❌ Timed out waiting for port.txt", colors.red);
          resolve(null);
        }
      }
    }, checkInterval);
  });
}

function killProcessOnPort(port) {
  try {
    if (process.platform === "win32") {
      const result = execSync(`netstat -ano | findstr :${port}`).toString();
      const pidMatch = result.match(/(\d+)\s*$/);
      if (pidMatch) execSync(`taskkill /F /PID ${pidMatch[1]}`);
    } else {
      const pid = execSync(`lsof -i:${port} -t`).toString().trim();
      if (pid) execSync(`kill -9 ${pid}`);
    }
  } catch {}
}

function checkProjectStructure() {
  ensureDirectoryExists(path.join(__dirname, "lib"));
  const apiConfigPath = path.join(__dirname, "lib", "api-config.js");

  if (!fs.existsSync(apiConfigPath)) {
    log("Creating lib/api-config.js...", colors.yellow);
    const content = `
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
const fetchWithAuth = async (endpoint, options = {}) => {
  let token = null;
  if (typeof window !== "undefined") token = localStorage.getItem("token");

  try {
    const response = await fetch(\`\${API_URL}\${endpoint}\`, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: token ? \`Bearer \${token}\` : "",
      },
    });
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return response;
  } catch (error) {
    console.error(\`Fetch error: \${endpoint}\`, error);
    throw error;
  }
};
export { API_URL, fetchWithAuth };
`;
    fs.writeFileSync(apiConfigPath, content.trim());
    log("✅ Created lib/api-config.js", colors.green);
  }

  const serverPath = path.join(__dirname, "server", "server.js");
  if (!fs.existsSync(serverPath)) {
    log("❌ server/server.js not found!", colors.red);
    return false;
  }

  return true;
}

async function main() {
  try {
    console.log("\n");
    log("╔════════════════════════════════════════════════╗", colors.cyan);
    log("║             MERN Dev Environment               ║", colors.cyan);
    log("║  Automatically starting backend and frontend   ║", colors.cyan);
    log("╚════════════════════════════════════════════════╝", colors.cyan);
    console.log("\n");

    if (!checkProjectStructure()) throw new Error("Project structure is invalid");

    log("🚀 Starting backend server...", colors.blue);
    const serverProcess = spawn("node", ["server.js"], {
      cwd: path.join(__dirname, "server"),
      stdio: "pipe",
      shell: true,
    });

    serverProcess.stdout.on("data", (data) =>
      data.toString().trim().split("\n").forEach((line) => console.log(`${colors.blue}[SERVER] ${line}${colors.reset}`))
    );
    serverProcess.stderr.on("data", (data) =>
      data.toString().trim().split("\n").forEach((line) => console.log(`${colors.red}[SERVER ERROR] ${line}${colors.reset}`))
    );

    const port = await waitForPortFile();
    if (!port) throw new Error("Could not read port.txt");

    updateEnvFile(port);

    log("🧠 Starting frontend...", colors.green);
    const frontendProcess = spawn("npm", ["run", "dev"], {
      cwd: __dirname,
      stdio: "pipe",
      shell: true,
    });

    frontendProcess.stdout.on("data", (data) =>
      data.toString().trim().split("\n").forEach((line) => console.log(`${colors.green}[FRONTEND] ${line}${colors.reset}`))
    );
    frontendProcess.stderr.on("data", (data) =>
      data.toString().trim().split("\n").forEach((line) => console.log(`${colors.red}[FRONTEND ERROR] ${line}${colors.reset}`))
    );

    const cleanup = () => {
      log("🛑 Shutting down...", colors.yellow);
      if (serverProcess && !serverProcess.killed) serverProcess.kill();
      if (frontendProcess && !frontendProcess.killed) frontendProcess.kill();
      if (port) killProcessOnPort(port);
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${colors.cyan}[DEV] ${colors.reset}`,
    });

    rl.on("line", (line) => {
      const cmd = line.trim().toLowerCase();
      if (["exit", "quit"].includes(cmd)) cleanup();
      else if (cmd === "help") {
        log("Available commands:\n  help\n  exit\n  quit\n  clear", colors.cyan);
      } else if (cmd === "clear") console.clear();
      rl.prompt();
    });

    log("✅ Dev environment ready. Type 'help' for commands.", colors.green);
    rl.prompt();
  } catch (err) {
    log(`💥 ${err.message}`, colors.red);
    process.exit(1);
  }
}

main();
