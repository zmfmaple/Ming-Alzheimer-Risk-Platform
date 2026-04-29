# OASIS-2 Longitudinal Dataset Integration Analysis

## 1. Inspection of OASIS-2 Dataset

### Overview
The OASIS-2 (Open Access Series of Imaging Studies) longitudinal dataset contains MRI brain scans from 150 subjects aged 18 to 96, with multiple visits per subject tracking dementia progression.

### Key Fields Identified

| Field | Description | Use for Analysis |
|-------|-------------|------------------|
| **ID** | Subject identifier | Link multiple visits |
| **Visit** | Visit number (1-5) | Longitudinal tracking |
| **MR Delay** | MR delay time | Data quality indicator |
| **MMSE** | Mini-Mental State Examination (0-30) | **Core** - cognitive function |
| **CDR** | Clinical Dementia Rating (0, 0.5, 1, 2) | **Core** - dementia severity |
| **Group** | Nondemented, Demented, Converted | **Core** - diagnostic groups |
| **SES** | Socioeconomic Status (1-5) | Risk factor |
| **Educ** | Years of education | Risk factor |
| **eTIV** | Estimated total intracranial volume | Brain size normalization |
| **nWBV** | Normalized whole brain volume | **Core** - brain atrophy marker |
| **ASF** | Atlas scaling factor | Brain size normalization |
| **Age** | Age at visit | Demographics |
| **M/F (Gender)** | Male/Female | Demographics |
| **Hand** | Handedness | Demographics |

### Overlap with Current Project
- **MMSE**: Directly matches current demo (cognitive assessment)
- **Age, Gender**: Matches demographics
- **Brain volume (nWBV)**: New valuable biomarker not in current data

### Fields Likely Not Useful
- **MR Delay**: Technical artifact, not clinically meaningful
- **ASF/eTIV**: Mostly used for normalization, less interpretable alone

---

## 2. Recommended Role in Project

### Best Role: Supplementary Longitudinal Analysis Dataset

OASIS-2 should serve as a **supporting dataset** for:
1. **Longitudinal trend visualization** (not in current demo)
2. **Brain volume progression analysis** (nWBV over time)
3. **CDR/MMSE change tracking** between groups
4. **Prototype for future monitoring features**

### Why NOT Merge Directly
- Different data collection (MRI vs. questionnaire)
- Requires neuroimaging expertise
- OASIS-2 subjects already have confirmed diagnoses
- Current demo uses risk prediction, not clinical diagnosis

---

## 3. Best Integration Strategy

### Option C (Recommended): Mock Tracking Page with Longitudinal Charts
- Create a new `/analysis` page
- Show OASIS-2 derived trends: MMSE over visits, CDR progression
- Compare: Nondemented vs Demented vs Converted groups
- No changes to main prediction workflow
- Perfect for student dissertation demonstration

### Why This Option?
- **Low risk**: No changes to core prediction pipeline
- **High value**: Shows longitudinal capability future work
- **Manageable**: Can be simple visualization without complex modeling
- **Defensible**: Clear methodological distinction from main analysis

---

## 4. Small Extension Implementation

I'll create a simple analysis page that:
1. Downloads OASIS-2 from Open Science Framework
2. Analyzes MMSE and CDR progression by group
3. Displays longitudinal trend chart