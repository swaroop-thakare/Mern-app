# MERN Agent Management System

A full-stack application for agent management and list distribution built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- Admin user authentication
- Agent creation and management
- CSV/Excel file upload and processing
- Automatic distribution of contacts among agents
- Responsive UI built with Next.js and shadcn/ui

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd mern-agent-management
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed

4. Start the development environment:
   \`\`\`bash
   npm run dev
   \`\`\`

This will:
- Start the backend server
- Find an available port
- Update the frontend environment variables
- Start the Next.js development server

## Default Admin Credentials

- Email: admin@example.com
- Password: admin123

## Project Structure

\`\`\`
mern-app/
├── app/                  # Next.js app directory
├── components/           # React components
├── lib/                  # Utility functions
│   └── api-config.js     # API configuration
├── server/               # Backend code
│   └── server.js         # Express server
├── dev.js                # Development script
└── package.json          # Project configuration
\`\`\`

## Available Scripts

- `npm run dev` - Start both frontend and backend with the automated script
- `npm run next:dev` - Start only the Next.js frontend
- `npm run server` - Start only the backend server
- `npm run seed` - Seed the database with initial data
- `npm run build` - Build the Next.js application for production
- `npm run start` - Start the production Next.js server

## Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`
MONGODB_URI=mongodb://localhost:27017/agent-management
JWT_SECRET=your_jwt_secret_key
PORT=5001
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### Agents
- `GET /api/agents` - Get all agents
- `POST /api/agents` - Create a new agent
- `DELETE /api/agents/:id` - Delete an agent

### Lists
- `POST /api/lists/upload` - Upload and process a CSV/Excel file
- `GET /api/lists/distribution` - Get distribution of contacts among agents
- `POST /api/lists/redistribute` - Redistribute contacts among agents

## Troubleshooting

If you encounter any issues:

1. Check if MongoDB is running
2. Verify that all environment variables are set correctly
3. Check the console for error messages
4. Make sure all dependencies are installed
5. Clear browser cache and localStorage if you encounter frontend issues

## License

MIT
