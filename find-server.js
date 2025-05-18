const fs = require("fs")
const path = require("path")

// Function to recursively search for a file
function findFile(dir, filename, depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return null

  try {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory() && file !== "node_modules" && file !== ".git") {
        const found = findFile(filePath, filename, depth + 1, maxDepth)
        if (found) return found
      } else if (file === filename) {
        return filePath
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message)
  }

  return null
}

// Find server.js
const rootDir = __dirname
const serverPath = findFile(rootDir, "server.js")

if (serverPath) {
  console.log("\x1b[32m%s\x1b[0m", "✅ Found server.js at:")
  console.log(serverPath)
  console.log("\nRelative path from project root:")
  console.log(path.relative(rootDir, serverPath))
} else {
  console.log("\x1b[31m%s\x1b[0m", "❌ Could not find server.js in the project")
}
