# BrainEcho Project Guide

## Active Application

- `frontend-react/`: Next.js user interface.
- `backend/`: FastAPI API, authentication, persistence, prediction, and model training.
- `models/`: deployed model artifacts.
- `data/raw/`: source training data.
- `data/runtime/`: local SQLite runtime data; never commit database files.

There is one active application stack: `frontend-react/` and `backend/`.

## Commands

Run commands from the project root unless a command changes directory explicitly.

```powershell
cd backend
python -m uvicorn main:app --reload
cd ..\frontend-react
npm run dev
```

The frontend uses `NEXT_PUBLIC_API_BASE_URL` when set and otherwise calls
`http://localhost:8000`.

## Boundaries

- Keep the 32 deployed model features synchronized between
  `backend/model_config.py`, `backend/schemas.py`, and the frontend assessment payload.
- Prediction and SHAP explanation must use the same transformed feature frame.
- Missing values must use training-split imputation values from
  `models/model_metadata.json`.
- Present output as conditional dataset-class membership, not diagnosis or future
  disease-onset prediction.
- HCAP and OASIS-2 are supplementary research analyses and must not be merged into the
  deployed questionnaire model without an explicit methodology change.

## Documentation

- `README.md`: setup and project map.
- `docs/ARCHITECTURE.md`: components, data flow, API, and persistence.
- `docs/DEVELOPMENT.md`: common development and verification commands.
