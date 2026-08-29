# BrainEcho Alzheimer Risk Platform

BrainEcho is a student research prototype for questionnaire-based Alzheimer's
risk-probability communication. It turns structured questionnaire input into a
calibrated machine-learning classification result, explains the strongest model
contributors, and optionally stores assessments for history and monitoring.

The project aims to move a notebook-based prediction workflow into an interactive
web platform. It is not a medical diagnosis tool and does not predict whether a
person will develop Alzheimer's disease in a future time period.

The primary prototype model was developed with the El Kharoua Alzheimer's Disease
Dataset, a synthetic educational dataset hosted on Kaggle, rather than real
patient clinical records. The displayed probability should therefore be read as a
model-derived demonstration output, not as a clinically validated individual risk
estimate.

NACC is used only as a separate supplementary longitudinal experiment. NACC raw
data and NACC-derived model artifacts are not included in this public repository,
because NACC is controlled-access data. The application keeps the synthetic
prototype output and the NACC supplementary route separate.

## Main Features

- Next.js questionnaire interface with English and Chinese language support
- FastAPI backend for validation, prediction, authentication and saved records
- Calibrated XGBoost prototype model with SHAP-style local explanations
- Separate NACC supplementary route status and probability reporting
- Data-quality warnings for missing, imputed or diagnosis-adjacent inputs
- History and trend review for saved local assessments
- Smoke tests and documentation for coursework reproducibility

## Project Map

```text
Alzheimer-Risk-Platform/
|-- backend/          FastAPI API, authentication, database, prediction, training
|-- frontend-react/   Active Next.js web application
|-- models/           Prototype model, scaler, calibrator, SHAP explainer, metadata
|-- data/
|   |-- raw/          Synthetic source model-development dataset
|   |-- runtime/      Local SQLite database, ignored by Git
|   `-- legacy/       Older database snapshots, ignored by Git
|-- reports/          Model evaluation and variable-evidence outputs
|-- research/         Dissertation material and supplementary analyses
|-- scripts/          API smoke tests and database inspection helpers
|-- legacy/           Early requirement notes and retired prototype code
`-- docs/             Architecture and development documentation
```

## Run Locally

Requirements: Python 3.10+ and Node.js 18+.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd frontend-react
npm install
npm run dev -- -p 3007
```

Open `http://localhost:3007`. The API is available at `http://localhost:8000`,
with interactive documentation at `http://localhost:8000/docs`.

For production-like use, set a strong `BRAINECHO_SECRET_KEY`. The frontend can
point to another API URL through `NEXT_PUBLIC_API_BASE_URL`.

## Main Workflow

1. The frontend collects questionnaire answers and derives values such as BMI.
2. FastAPI validates the payload and fills permitted missing values from training
   metadata.
3. The deployed XGBoost model produces a score and the calibrator converts it into
   the displayed probability.
4. SHAP identifies the strongest contributors to that particular model output.
5. Authenticated assessments are stored in `data/runtime/alzheimers.db`.

## Data Availability

The public repository includes code, configuration, documentation, and
non-sensitive evaluation summaries. Local runtime databases are ignored by Git.
Controlled-access NACC data and NACC-derived model artifacts are excluded. To
reproduce the supplementary NACC route, an authorised user must obtain NACC data
separately and rerun the documented processing pipeline in a permitted local
environment.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the component-level
explanation and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for maintenance
commands.
