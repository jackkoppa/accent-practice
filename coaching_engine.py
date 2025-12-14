import os
from openai import OpenAI


def get_coaching_tips(reference_text, scores):
    """
    Uses LLM to generate feedback based on scores.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        return "⚠️ **Demo Mode:** You sounded great! (Add an OpenAI API Key to .env to get real feedback)."

    client = OpenAI(api_key=api_key)

    # We treat the Azure JSON as context for the LLM
    prompt = f"""
    You are an expert American English Dialect Coach.
    
    CONTEXT:
    The student attempted to read: "{reference_text}"
    Here is the technical analysis of their speech: {scores}
    
    TASK:
    1. Analyze the scores (and JSON payload if available) to find specific phoneme errors.
    2. Provide 3 bullet points of specific, encouraging, actionable advice.
    3. Focus on mouth positioning (tongue, lips) for the errors detected.
    4. Keep it concise (under 100 words).
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error connecting to Coach: {str(e)}"
