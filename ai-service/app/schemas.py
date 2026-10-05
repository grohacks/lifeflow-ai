from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class VitalDataPoint(BaseModel):
    timestamp: datetime
    value: float

class ForecastRequest(BaseModel):
    case_id: str
    metric: str
    history: List[VitalDataPoint]
    horizons_minutes: List[int] = Field(default=[5, 10, 15, 20, 30])

class ForecastResult(BaseModel):
    horizon_minutes: int
    forecast_value: Optional[float]
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    confidence: float

class ForecastResponse(BaseModel):
    case_id: str
    metric: str
    model_name: str
    model_version: str
    forecasts: List[ForecastResult]
    status: str # COMPLETED, INSUFFICIENT_DATA

class VisionAnalysisResponse(BaseModel):
    possible_injury_region: str
    possible_visible_bleeding: str
    confidence: float
    requires_human_confirmation: str = "AI observation — requires human confirmation"
    features: Dict[str, Any]
