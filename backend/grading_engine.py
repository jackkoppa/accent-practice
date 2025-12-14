import os
import json

try:
    import azure.cognitiveservices.speech as speechsdk
except ImportError:
    speechsdk = None


def get_pronunciation_score(audio_filepath: str, reference_text: str) -> dict:
    """
    Sends audio to Azure for phoneme-level grading.
    Returns a dictionary of scores.
    """
    
    # Check for API Keys
    azure_key = os.getenv("AZURE_SPEECH_KEY")
    azure_region = os.getenv("AZURE_SPEECH_REGION")
    
    # MOCK MODE: If keys are missing, return dummy data for UI testing
    if not azure_key or not azure_region:
        return {
            "pronunciation": 85, 
            "fluency": 90, 
            "completeness": 95,
            "mock_data": True,
            "details": "Running in mock mode (No Azure Keys found)"
        }

    # Check if Azure SDK is available
    if speechsdk is None:
        return {
            "pronunciation": 85, 
            "fluency": 90, 
            "completeness": 95,
            "mock_data": True,
            "details": "Running in mock mode (Azure SDK not installed)"
        }

    # Real Azure Implementation
    try:
        speech_config = speechsdk.SpeechConfig(subscription=azure_key, region=azure_region)
        audio_config = speechsdk.audio.AudioConfig(filename=audio_filepath)

        # Configure the assessment
        pronunciation_config = speechsdk.PronunciationAssessmentConfig(
            reference_text=reference_text,
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True
        )

        recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
        pronunciation_config.apply_to(recognizer)

        # Run recognition
        result = recognizer.recognize_once()

        # Check result
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            pronunciation_result = speechsdk.PronunciationAssessmentResult(result)
            
            return {
                "pronunciation": pronunciation_result.pronunciation_score,
                "fluency": pronunciation_result.fluency_score,
                "completeness": pronunciation_result.completeness_score,
                "full_json_payload": result.json 
            }
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return {"pronunciation": 0, "error": "No speech recognized."}
        else:
            return {"pronunciation": 0, "error": "Speech analysis failed."}
             
    except Exception as e:
        return {"pronunciation": 0, "error": str(e)}
