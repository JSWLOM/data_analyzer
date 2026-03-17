from groq import Groq
import pandas as pd
import os
import json
import PyPDF2
import io
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_data(df: pd.DataFrame, question: str) -> dict:
    info = f"""
    Columns: {list(df.columns)}
    Shape: {df.shape[0]} rows, {df.shape[1]} columns
    Data Types: {df.dtypes.to_dict()}
    Sample Data (first 100 rows):
    {df.head(100).to_string()}
    """

    prompt = f"""
    You are an expert data analyst.
    Analyze the following dataset and answer the question clearly.

    DATASET INFO:
    {info}

    QUESTION: {question}

    Respond in this EXACT JSON format and nothing else:
    {{
        "answer": "your detailed text answer here",
        "chart": {{
            "type": "bar or line or pie or null",
            "title": "chart title",
            "labels": ["label1", "label2"],
            "values": [100, 200]
        }}
    }}

    Rules for chart:
    - If the answer involves comparison of categories → use "bar"
    - If the answer involves trend over time → use "line"
    - If the answer involves percentage or share → use "pie"
    - If no chart makes sense → set type to null
    - labels and values must have same length
    - Maximum 10 labels
    - Only include chart if it genuinely helps visualize the answer
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )

    raw = response.choices[0].message.content

    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        result = json.loads(clean.strip())
    except:
        result = {"answer": raw, "chart": {"type": None}}

    return result


def analyze_pdf(contents: bytes, question: str) -> dict:
    # Extract text from PDF
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
    
    text = ""
    for i, page in enumerate(pdf_reader.pages):
        text += f"\n--- Page {i+1} ---\n"
        text += page.extract_text() or ""

    # Limit text to avoid token overflow
    if len(text) > 8000:
        text = text[:8000] + "\n... (truncated)"

    prompt = f"""
    You are an expert document analyst.
    Analyze the following PDF content and answer the question clearly.

    PDF CONTENT:
    {text}

    QUESTION: {question}

    Respond in this EXACT JSON format and nothing else:
    {{
        "answer": "your detailed text answer here",
        "chart": {{
            "type": null,
            "title": "",
            "labels": [],
            "values": []
        }}
    }}

    STRICT RULES:
- ONLY answer using information found in the PDF content above
- If the answer is NOT in the document, say "This information is not found in the uploaded document"
- Do NOT use any outside knowledge
- Always mention which page the answer came from if possible
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )

    raw = response.choices[0].message.content

    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        result = json.loads(clean.strip())
    except:
        result = {"answer": raw, "chart": {"type": None}}

    return result