# AI Data Analyzer
AI-powered data analysis tool built with FastAPI, Groq LLaMA and Chart.js.

## Features
- Upload CSV, Excel, PDF files
- Ask questions in plain English
- Auto-generated charts
- Dark mode

## Tech Stack
- Backend: Python, FastAPI
- AI: Groq API (LLaMA 3.3 70B)
- Frontend: HTML, CSS, JavaScript, Chart.js

## Setup
1. pip install -r requirements.txt
2. Add GROQ_API_KEY to .env file
3. py -m uvicorn main:app --reload