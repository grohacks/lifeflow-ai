from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import ForecastRequest, ForecastResponse, VisionAnalysisResponse
from .forecasting import PatientVitalForecaster
from .vision import LocalInjuryVisionAnalyzer

app = FastAPI(
    title="LifeFlow AI Service",
    description="Predictive Emergency Healthcare Forecasting and Local Baseline Vision Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

forecaster = PatientVitalForecaster()
vision_analyzer = LocalInjuryVisionAnalyzer()

@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "lifeflow-ai-service",
        "version": "1.0.0"
    }

@app.post("/forecast/patient", response_model=ForecastResponse)
def forecast_patient(request: ForecastRequest):
    try:
        return forecaster.forecast(
            case_id=request.case_id,
            metric=request.metric,
            history=request.history,
            horizons=request.horizons_minutes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    try:
        content = await file.read()
        return vision_analyzer.analyze_image(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from .handover import EmergencyHandoverGenerator
from .assistant import LocalOllamaAssistant

handover_gen = EmergencyHandoverGenerator()
assistant = LocalOllamaAssistant()

@app.post("/handover/generate")
def generate_handover(case_data: dict):
    return handover_gen.generate_sbar_handover(case_data)

@app.post("/assistant/query")
def query_assistant(payload: dict):
    question = payload.get("question", "")
    context = payload.get("context", {})
    return assistant.query(question, context)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
