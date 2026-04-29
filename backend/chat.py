"""
FastAPI Backend - Chat endpoint for AI Report Assistant
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json

app = FastAPI()


class ChatMessage(BaseModel):
    message: str
    result: Optional[dict] = None
    formData: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None


# System prompt for the assistant
SYSTEM_PROMPT = """You are an AI Report Explanation Assistant for Alzheimer's risk assessment.

Your role is to:
- Explain the assessment report results
- Clarify what the risk factors mean
- Summarize the report in simple language
- Help users understand their results

You must NOT:
- Provide medical diagnosis
- Give treatment recommendations
- Act like a doctor
- Claim the user has Alzheimer's disease
- Answer medical questions unrelated to the report

If asked outside your scope, respond:
"I can help explain your assessment report, but I cannot provide medical diagnosis or treatment advice. Please consult a healthcare professional for medical concerns."

Always stay helpful, clear, and within your defined role."""


def generate_response(user_message: str, result: dict, formData: dict) -> str:
    """Generate a simple response based on the report data"""

    risk_level = result.get('risk_level', 'Unknown')
    risk_prob = result.get('risk_probability', 0)
    top_factors = result.get('top_explanations', [])

    # Build context from result
    context = f"""
Current Report Data:
- Risk Level: {risk_level}
- Risk Probability: {risk_prob*100:.1f}%
- Top Risk Factors: {json.dumps(top_factors, ensure_ascii=False)}

User's Input Summary:
- Age: {formData.get('Age', 'N/A')}
- Gender: {'Male' if formData.get('Gender') == 1 else 'Female'}
- MMSE Score: {formData.get('MMSE', 'N/A')}/30
- BMI: {formData.get('BMI', 'N/A')}
- Family History of Alzheimer's: {'Yes' if formData.get('FamilyHistoryAlzheimers') == 1 else 'No'}
"""

    user_lower = user_message.lower()

    # Pattern matching for common questions
    if any(kw in user_lower for kw in ['explain', 'mean', 'what is', 'understand']):
        if risk_prob >= 0.7:
            return f"""Based on your assessment, your risk level is **{risk_level}** ({risk_prob*100:.1f}% probability).

This elevated risk score is primarily influenced by several factors in your assessment. The key contributors are:

{chr(10).join([f"• {f['feature']}: {'Increases' if f['impact'] == 'positive' else 'Decreases'} risk (SHAP: {f['shap_value']:.4f})" for f in top_factors[:3]])}

**What this means:** Your result indicates a higher probability of Alzheimer's-related risk factors. However, this is not a diagnosis. I recommend discussing these results with a healthcare professional for proper evaluation.

**Note:** This assessment is for informational purposes only and should not replace professional medical advice."""

        elif risk_prob >= 0.4:
            return f"""Your risk assessment shows a **{risk_level}** ({risk_prob*100:.1f}% probability).

The main factors influencing this result include:

{chr(10).join([f"• {f['feature']}: {'Increases' if f['impact'] == 'positive' else 'Decreases'} risk" for f in top_factors[:3]])}

**What this means:** You have a moderate risk level. This suggests some risk factors are present but not at concerning levels. Maintaining a healthy lifestyle and regular check-ups is recommended.

**Remember:** This is not a medical diagnosis - please consult healthcare professionals for medical advice."""

        else:
            return f"""Great news! Your risk assessment shows a **{risk_level}** ({risk_prob*100:.1f}% probability).

Your result indicates lower risk based on the factors you reported. The factors that help reduce your risk include:

{chr(10).join([f"• {f['feature']}: Helps lower risk" for f in top_factors if f['impact'] == 'negative'])}

**What this means:** Your current profile shows fewer risk factors. Continue maintaining a healthy lifestyle to support brain health.

**Note:** This is an informational assessment only, not a medical diagnosis."""

    elif any(kw in user_lower for kw in ['why', '原因', 'factor', '原因']):
        factors_text = []
        for i, f in enumerate(top_factors, 1):
            impact = "increases" if f['impact'] == 'positive' else "decreases"
            factors_text.append(f"{i}. **{f['feature']}** - This factor {impact} your risk score (impact: {f['shap_value']:.4f})")

        return f"""Here are the key factors that influenced your result:

{chr(10).join(factors_text)}

These factors were identified using SHAP (SHapley Additive exPlanations) analysis, which shows how each feature contributes to the prediction model."""

    elif any(kw in user_lower for kw in ['high', 'low', 'score', '概率']):
        return f"""Your risk probability score is **{risk_prob*100:.1f}%**, indicating a **{risk_level}** risk level.

Risk probability interpretation:
- 0-40%: Low risk (green)
- 40-70%: Medium risk (yellow)
- 70-100%: High risk (red)

Your score falls in the {risk_level} range based on the combination of all your assessment factors."""

    elif any(kw in user_lower for kw in ['mmse', 'cognitive', 'memory']):
        mmse = formData.get('MMSE', 'N/A')
        if isinstance(mmse, (int, float)):
            if mmse >= 24:
                return f"""Your MMSE (Mini-Mental State Examination) score is **{mmse}/30**, which falls within the normal range.

MMSE interpretation:
- 24-30: Normal
- 18-23: Mild cognitive impairment
- 0-17: Moderate to severe impairment

Your score suggests normal cognitive function based on the assessment factors provided."""
            else:
                return f"""Your MMSE score is **{mmse}/30**, which may indicate some cognitive concerns.

This is one of the factors considered in your overall risk assessment. A lower MMSE score, combined with other risk factors, can influence the overall risk prediction.

**Important:** Please consult a healthcare professional for proper cognitive evaluation."""
        return "MMSE (Mini-Mental State Examination) is a cognitive screening test. Your score is included in the assessment."

    elif any(kw in user_lower for kw in ['summary', 'simple', 'easy', '总结', '简单']):
        return f"""Here's a simple summary of your assessment:

**Your Risk:** {risk_level} ({risk_prob*100:.1f}%)

**Key Points:**
{chr(10).join([f"- {f['feature']}: {'Raises' if f['impact'] == 'positive' else 'Lowers'} risk" for f in top_factors[:3]])}

**Your Profile:**
- Age: {formData.get('Age', 'N/A')}
- BMI: {formData.get('BMI', 'N/A')}
- Lifestyle factors (exercise, sleep, diet) are factored into the assessment

This assessment helps you understand your risk factors. It's not a medical diagnosis - please consult professionals for medical advice."""

    elif any(kw in user_lower for kw in ['diagnosis', 'doctor', '治疗', 'medical', 'cure']):
        return """I understand you may have questions about diagnosis or treatment.

However, I'm specifically designed to **explain your assessment report** - I cannot provide:
- Medical diagnosis
- Treatment recommendations
- Doctor-like advice

**Please consult a healthcare professional** for:
- Formal medical diagnosis
- Treatment options
- Medical concerns

Your assessment result is for informational purposes only and should be discussed with a qualified healthcare provider."""

    else:
        return f"""I'd be happy to help explain your assessment result!

Your current risk level is **{risk_level}** with a **{risk_prob*100:.1f}%** probability.

Here are some things I can help you with:
- Explain what your result means
- Explain why your risk is high or low
- Describe the key risk factors
- Summarize your report in simple terms
- Clarify what MMSE or other scores mean

Feel free to ask any of these questions!"""


@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Handle chat requests for report explanation"""

    if not message.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Get context from result and formData
    result = message.result or {}
    formData = message.formData or {}

    # Generate response based on the current report data
    response = generate_response(message.message, result, formData)

    return ChatResponse(
        response=response,
        sources=["assessment_result", "shap_analysis"]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)