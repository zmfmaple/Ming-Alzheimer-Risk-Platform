# Development

Run commands from the repository root unless noted otherwise.

## Backend

```powershell
cd backend
python test_input_contract.py
cd ..
python scripts/test_predict_demo.py
python scripts/test_full_suite.py
```

Start the API separately with:

```powershell
cd backend
python -m uvicorn main:app --reload
```

The smoke-test scripts expect that API at `http://127.0.0.1:8000`.

## Frontend

```powershell
cd frontend-react
npm install
npm run dev
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` when the API is not running at
`http://localhost:8000`.

## Model Maintenance

The source dataset is `data/raw/alzheimers_disease_data.csv`.

```powershell
python backend/train_model.py
python backend/refresh_input_contract.py
python backend/run_sensitivity_analysis.py
```

Training replaces files in `models/` and refreshes evaluation output under
`reports/model_evaluation/`. Review both sets of changes together.

## Database

The active local database is `data/runtime/alzheimers.db`. Database files are ignored
by Git because they may contain user-entered assessment data.

```powershell
python scripts/view_database.py
```

`data/legacy/alzheimers-root.db` is an older preserved snapshot and is not used by the
application.
