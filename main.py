from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
import io
from analyzer import analyze_data, analyze_pdf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def root():
    return FileResponse("frontend/index.html")

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    try:
        contents = await file.read()

        # PDF file
        if file.filename.endswith(".pdf"):
            result = analyze_pdf(contents, question)
            return {
                "answer": result.get("answer", ""),
                "chart": result.get("chart", {"type": None}),
                "rows": "N/A",
                "columns": "N/A",
                "column_names": [],
                "file_type": "pdf"
            }

        # CSV file
        elif file.filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # Excel file
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))

        else:
            return {"error": "Only CSV, Excel and PDF files are supported!"}

        result = analyze_data(df, question)

        return {
            "answer": result.get("answer", ""),
            "chart": result.get("chart", {"type": None}),
            "rows": df.shape[0],
            "columns": df.shape[1],
            "column_names": list(df.columns),
            "file_type": "data"
        }

    except Exception as e:
        return {"error": str(e)}