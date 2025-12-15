import os
from openai import OpenAI, RateLimitError, APIError as OpenAIAPIError, AuthenticationError


class CoachingAPIError(Exception):
    """Custom exception for coaching API errors with error type classification."""
    def __init__(self, message: str, error_type: str, details: str = None):
        self.message = message
        self.error_type = error_type  # 'rate_limit', 'quota_exceeded', 'auth_error', 'service_error'
        self.details = details
        super().__init__(self.message)


def get_coaching_tips(reference_text: str, scores: dict) -> str:
    """
    Uses LLM to generate feedback based on scores.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        return "**Demo Mode:** Great effort! Your pronunciation scores look good. To get personalized coaching tips, add an OpenAI API key to your environment."

    client = OpenAI(api_key=api_key)

    prompt = f"""
    You are an expert American English Dialect Coach - warm, encouraging, and specific.
    
    CONTEXT:
    The student attempted to read: "{reference_text}"
    Here is the technical analysis of their speech: {scores}
    
    TASK:
    1. Start with a brief, encouraging observation about what they did well.
    2. Analyze the scores (and JSON payload if available) to find specific areas for improvement.
    3. Provide 2-3 specific, actionable tips focusing on mouth positioning (tongue, lips, jaw).
    4. End with an encouraging note.
    5. Use markdown formatting for readability.
    6. Keep it concise (under 150 words).
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except RateLimitError as e:
        error_msg = str(e)
        # Check if it's a quota exceeded error vs rate limit
        if "quota" in error_msg.lower() or "exceeded" in error_msg.lower() or "billing" in error_msg.lower():
            raise CoachingAPIError(
                "OpenAI API quota exceeded. The billing limit has been reached. Please contact the app administrator.",
                "quota_exceeded",
                error_msg
            )
        else:
            raise CoachingAPIError(
                "OpenAI API rate limit exceeded. Please wait a moment and try again.",
                "rate_limit",
                error_msg
            )
    except AuthenticationError as e:
        raise CoachingAPIError(
            "OpenAI API authentication failed. Please contact the app administrator.",
            "auth_error",
            str(e)
        )
    except OpenAIAPIError as e:
        error_msg = str(e)
        if "429" in error_msg:
            raise CoachingAPIError(
                "OpenAI API rate limit exceeded. Please wait a moment and try again.",
                "rate_limit",
                error_msg
            )
        raise CoachingAPIError(
            "OpenAI service error. Please try again later.",
            "service_error",
            error_msg
        )
    except Exception as e:
        return f"Error connecting to Coach: {str(e)}"
