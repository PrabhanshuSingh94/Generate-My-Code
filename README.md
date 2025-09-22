# Generate My Code

**Generate My Code** is a web application that allows users to generate code snippets from natural language prompts using Google Gemini API. The project consists of a **React frontend** and an **Express.js backend**.

---

## Project Structure

generate-my-code/
│
├── client/ # React frontend
│ └── App.js # Main React component for chat interface
│
├── server/ # Express backend
│ └── server.js # Node.js API for code generation using Gemini API
│
└── README.md # Project documentation


---

## Server

The backend is built using **Express.js** and connects to **Google Gemini API** for generating code.  

### Features

- Provides a `/api/generate` POST endpoint.
- Supports optional model selection.
- Returns generated code snippets based on user prompts.
- Handles errors and invalid inputs gracefully.

### Environment Variables

Create a `.env` file in the `server` folder with:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_MODEL=gemini-2.5-flash



###Install & Run
cd server
npm install
node server.js

Server runs at http://localhost:3000.

Client

The frontend is built with React and provides a ChatGPT-like interface for sending prompts and receiving code.

Features

Start new chats or select existing conversations.

Edit chat titles and messages.

Auto-scroll and typing animation for responses.

Code block rendering with language detection and copy-to-clipboard functionality.

**Install & Run**
cd client
npm install
npm start


Frontend runs at http://localhost:3000 (or default React port 3000, ensure it does not conflict with the server).

Usage

Start the backend server first (server.js).

Start the frontend React app.

Type a natural language prompt (e.g., "Write a JS function to reverse a string").

Click Send and view the generated code in the chat interface.

Technologies Used

Frontend: React, Lucide-React, Tailwind CSS

Backend: Node.js, Express.js, dotenv, CORS

API: Google Gemini AI
