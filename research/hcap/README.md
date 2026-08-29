# HCAP supplementary analysis

This directory contains reproducible aggregate experiments for the restricted
2016 HRS HCAP data. It does not contain respondent-level HRS data.

Run:

```powershell
python research/hcap/run_hcap_experiments.py `
  --summary "path\to\HC16HP_F.dta" `
  --respondent "path\to\hc16hp_r.dta" `
  --output-dir "research\hcap\results"
```

The results must be described as cross-sectional cognitive-status
classification. They are not prospective Alzheimer disease risk prediction.

