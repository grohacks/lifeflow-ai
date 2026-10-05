# LifeFlow AI — AI & Predictive Analytics Architecture

LifeFlow AI utilizes local, zero-cost machine learning and statistical modeling microservices implemented in Python (FastAPI, Scikit-Learn, NumPy, OpenCV).

---

## 1. Vital Signs Time-Series Forecasting

### 1.1 Methodology
The forecasting engine (`ai-service/app/forecasting.py`) evaluates historical time-series observations for a patient case and computes predicted trajectories across multiple clinical horizons:
- **5-Minute Horizon**: Tactical short-term trajectory for active en route interventions.
- **15-Minute Horizon**: Mid-term trend reflecting stabilization or ongoing decompensation.
- **30-Minute Horizon**: Strategic arrival state estimation used by the receiving hospital trauma team.

### 1.2 Mathematical Formulation
For each vital sign $y$ with time points $t_1, t_2, \dots, t_n$:
1. **Exponentially Weighted Moving Average (EWMA)**:
   $$S_t = \alpha \cdot y_t + (1 - \alpha) \cdot S_{t-1}$$
   where smoothing factor $\alpha = 0.3$.
2. **Trend Slope**:
   Linear regression over recent points yields slope $m$ and intercept $b$:
   $$\hat{y}(t + \Delta t) = m \cdot (t + \Delta t) + b$$
3. **Uncertainty Bounds**:
   Prediction intervals are computed using the residual standard deviation $\sigma_{\epsilon}$:
   $$\text{Lower Bound} = \hat{y} - 1.96 \cdot \sigma_{\epsilon} \cdot \sqrt{1 + \frac{\Delta t}{30}}$$
   $$\text{Upper Bound} = \hat{y} + 1.96 \cdot \sigma_{\epsilon} \cdot \sqrt{1 + \frac{\Delta t}{30}}$$

### 1.3 Deterioration Index Scoring
A normalized Deterioration Score $D \in [0.0, 1.0]$ is computed based on deviations from physiological norms:
- Heart Rate $> 110$ or $< 50$ bpm (+0.25)
- MAP $< 65$ mmHg (+0.35)
- SpO2 $< 90\%$ (+0.30)
- Respiratory Rate $> 28$ or $< 10$ bpm (+0.20)

---

## 2. Computer Vision Baseline Feature Extraction

The vision pipeline (`ai-service/app/vision.py`) performs non-diagnostic triage feature extraction from paramedic-captured clinical images (e.g., wound inspection, ultrasound snapshot, pupil reactivity):
- **Color Channel Distribution**: Extracts mean and standard deviation for RGB/HSV channels (erythema/cyanosis detection).
- **Shannon Image Entropy**: Measures spatial irregularity and tissue texture complexity:
  $$H = -\sum_{i} p_i \log_2(p_i)$$
- **Laplacian Variance**: Evaluates image sharpness to ensure out-of-focus captures are flagged for re-acquisition.
- **Edge Density**: Computes Canny edge pixel ratio to quantify laceration or anatomical disruption.

### Required Regulatory Disclaimer
Every vision analysis response includes the mandatory safeguard banner:
> **"AI observation — requires human confirmation. Non-diagnostic image analysis for triage assistance only."**
