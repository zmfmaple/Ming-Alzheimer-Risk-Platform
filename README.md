# Ming Alzheimer Risk Platform

This project is a machine learning web demo for Alzheimer’s risk assessment.  
It aims to transform a notebook-based prediction workflow into an interactive web platform where users can complete a structured questionnaire, receive a risk prediction result, and view a basic explanatory report.

## Project Overview

The project combines machine learning, backend API development, and frontend interface design.  
The main goal is to demonstrate how an AI/ML model can be connected with a usable web system, instead of only staying inside a Jupyter Notebook.

The current workflow is:

1. Users complete a health and lifestyle questionnaire.
2. The frontend sends the structured input data to the backend.
3. The backend processes the input and returns a prediction result.
4. The frontend displays the risk result and a basic report page.

## Main Features

- React-based frontend interface
- Structured questionnaire input form
- Backend prediction API
- Machine learning risk prediction workflow
- Basic risk report generation
- Field validation between frontend and backend
- Initial model explanation idea using feature importance / SHAP-style interpretation
- OASIS dataset analysis as supplementary exploration

## Project Structure

```text
Ming-Alzheimer-Risk-Platform/
│
├── backend/              # Backend API and prediction logic
├── frontend-react/       # React frontend application
├── frontend/             # Additional frontend files or earlier version
├── models/               # Model-related files
├── oasis_analysis/       # Supplementary OASIS dataset analysis
├── archive (1)/          # Archived or previous project files
├── requirements.txt      # Python dependencies
├── CLAUDE.md             # Development notes for AI-assisted coding
└── .gitignore
