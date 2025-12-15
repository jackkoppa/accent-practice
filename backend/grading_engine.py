import os
import json

try:
    import azure.cognitiveservices.speech as speechsdk
except ImportError:
    speechsdk = None


class APIError(Exception):
    """Custom exception for API errors with error type classification."""
    def __init__(self, message: str, error_type: str, details: str = None):
        self.message = message
        self.error_type = error_type  # 'rate_limit', 'quota_exceeded', 'auth_error', 'service_error'
        self.details = details
        super().__init__(self.message)


def parse_azure_response(result_json: str) -> dict:
    """
    Parse Azure's detailed JSON response to extract useful debugging information.
    Returns word-level and phoneme-level details for the UI debug view.
    """
    try:
        data = json.loads(result_json)
        
        # Extract NBest results (Azure returns multiple hypothesis)
        nbest = data.get('NBest', [])
        if not nbest:
            return {"error": "No detailed results available"}
        
        best_result = nbest[0]  # Take the best hypothesis
        
        # Extract word-level details
        words = []
        for word_data in best_result.get('Words', []):
            word_info = {
                "word": word_data.get('Word', ''),
                "accuracy_score": round(word_data.get('PronunciationAssessment', {}).get('AccuracyScore', 0), 1),
                "error_type": word_data.get('PronunciationAssessment', {}).get('ErrorType', 'None'),
                # Include timing information for audio playback animation
                "offset": word_data.get('Offset'),  # Offset in 100-nanosecond units
                "duration": word_data.get('Duration'),  # Duration in 100-nanosecond units
            }
            
            # Extract phonemes for this word
            phonemes = []
            for phoneme_data in word_data.get('Phonemes', []):
                phonemes.append({
                    "phoneme": phoneme_data.get('Phoneme', ''),
                    "accuracy_score": round(phoneme_data.get('PronunciationAssessment', {}).get('AccuracyScore', 0), 1)
                })
            
            word_info['phonemes'] = phonemes
            words.append(word_info)
        
        # Extract overall metrics
        pronunciation_assessment = best_result.get('PronunciationAssessment', {})
        
        return {
            "recognized_text": best_result.get('Display', ''),
            "words": words,
            "overall_metrics": {
                "accuracy_score": round(pronunciation_assessment.get('AccuracyScore', 0), 1),
                "fluency_score": round(pronunciation_assessment.get('FluencyScore', 0), 1),
                "completeness_score": round(pronunciation_assessment.get('CompletenessScore', 0), 1),
                "pronunciation_score": round(pronunciation_assessment.get('PronScore', 0), 1)
            }
        }
    except Exception as e:
        return {"error": f"Failed to parse Azure response: {str(e)}"}


def get_pronunciation_score(audio_filepath: str, reference_text: str, strictness: int = 3) -> dict:
    """
    Sends audio to Azure for phoneme-level grading.
    Returns a dictionary of scores.
    
    Args:
        audio_filepath: Path to the audio file
        reference_text: The text that should have been spoken
        strictness: Grading strictness level (1-5, where 5 is strictest). Default is 3 for stricter grading.
    """
    
    # Validate strictness parameter
    strictness = max(1, min(5, strictness))  # Clamp between 1 and 5
    
    # Check for API Keys
    azure_key = os.getenv("AZURE_SPEECH_KEY")
    azure_region = os.getenv("AZURE_SPEECH_REGION")
    
    # MOCK MODE: If keys are missing, return dummy data for UI testing
    if not azure_key or not azure_region:
        mock_words = []
        offset = 0
        for word in reference_text.split():
            mock_words.append({
                "word": word,
                "accuracy_score": 82.5,
                "error_type": "None",
                "phonemes": [{"phoneme": "mock", "accuracy_score": 85.0}],
                "offset": offset * 10000000,  # Mock timing in 100-nanosecond units
                "duration": 5000000,  # ~500ms per word
            })
            offset += 500  # 500ms between words
        mock_debug_data = {
            "recognized_text": reference_text,
            "words": mock_words,
            "overall_metrics": {
                "accuracy_score": 85.0,
                "fluency_score": 90.0,
                "completeness_score": 95.0,
                "pronunciation_score": 85.0
            }
        }
        return {
            "pronunciation": 85, 
            "fluency": 90, 
            "completeness": 95,
            "mock_data": True,
            "details": "Running in mock mode (No Azure Keys found)",
            "azure_debug": mock_debug_data
        }

    # Check if Azure SDK is available
    if speechsdk is None:
        mock_words = []
        offset = 0
        for word in reference_text.split():
            mock_words.append({
                "word": word,
                "accuracy_score": 82.5,
                "error_type": "None",
                "phonemes": [{"phoneme": "mock", "accuracy_score": 85.0}],
                "offset": offset * 10000000,  # Mock timing in 100-nanosecond units
                "duration": 5000000,  # ~500ms per word
            })
            offset += 500  # 500ms between words
        mock_debug_data = {
            "recognized_text": reference_text,
            "words": mock_words,
            "overall_metrics": {
                "accuracy_score": 85.0,
                "fluency_score": 90.0,
                "completeness_score": 95.0,
                "pronunciation_score": 85.0
            }
        }
        return {
            "pronunciation": 85, 
            "fluency": 90, 
            "completeness": 95,
            "mock_data": True,
            "details": "Running in mock mode (Azure SDK not installed)",
            "azure_debug": mock_debug_data
        }

    # Real Azure Implementation
    try:
        speech_config = speechsdk.SpeechConfig(subscription=azure_key, region=azure_region)
        audio_config = speechsdk.audio.AudioConfig(filename=audio_filepath)

        # Configure the assessment with strictness parameter
        # Strictness 1 = most lenient (score threshold 30), 5 = most strict (score threshold 70)
        # Default is 3 (score threshold 50) for balanced but stricter grading
        score_thresholds = {
            1: 30,  # Very lenient
            2: 40,  # Lenient
            3: 50,  # Balanced (stricter than before)
            4: 60,  # Strict
            5: 70   # Very strict
        }
        
        pronunciation_config = speechsdk.PronunciationAssessmentConfig(
            reference_text=reference_text,
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True
        )
        
        # Set the accuracy threshold based on strictness
        pronunciation_config.phoneme_alphabet = "IPA"
        pronunciation_config.enable_prosody_assessment()

        recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
        pronunciation_config.apply_to(recognizer)

        # Run recognition
        result = recognizer.recognize_once()

        # Check result
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            pronunciation_result = speechsdk.PronunciationAssessmentResult(result)
            
            # Parse the detailed Azure response for debugging
            azure_debug = parse_azure_response(result.json)
            
            # Apply strictness adjustment to scores
            # Higher strictness = lower scores for the same performance
            strictness_multiplier = 1.0 - ((strictness - 3) * 0.1)  # 3 is neutral (1.0x), 5 is strict (0.8x), 1 is lenient (1.2x)
            
            adjusted_pronunciation = pronunciation_result.pronunciation_score * strictness_multiplier
            adjusted_fluency = pronunciation_result.fluency_score * strictness_multiplier
            adjusted_completeness = pronunciation_result.completeness_score * strictness_multiplier
            
            # Cap at 100
            adjusted_pronunciation = min(100, max(0, adjusted_pronunciation))
            adjusted_fluency = min(100, max(0, adjusted_fluency))
            adjusted_completeness = min(100, max(0, adjusted_completeness))
            
            return {
                "pronunciation": round(adjusted_pronunciation, 1),
                "fluency": round(adjusted_fluency, 1),
                "completeness": round(adjusted_completeness, 1),
                "azure_debug": azure_debug,
                "strictness_level": strictness
            }
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return {"pronunciation": 0, "error": "No speech recognized."}
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = speechsdk.CancellationDetails(result)
            error_msg = str(cancellation.error_details) if cancellation.error_details else "Speech analysis canceled"
            
            # Check for rate limiting or quota errors
            if "429" in error_msg or "rate limit" in error_msg.lower() or "too many requests" in error_msg.lower():
                raise APIError(
                    "Azure Speech API rate limit exceeded. Please wait a moment and try again.",
                    "rate_limit",
                    error_msg
                )
            elif "quota" in error_msg.lower() or "exceeded" in error_msg.lower() or "limit" in error_msg.lower():
                raise APIError(
                    "Azure Speech API quota exceeded. The monthly limit has been reached. Please contact the app administrator.",
                    "quota_exceeded",
                    error_msg
                )
            elif "401" in error_msg or "403" in error_msg or "unauthorized" in error_msg.lower() or "invalid" in error_msg.lower():
                raise APIError(
                    "Azure Speech API authentication failed. Please contact the app administrator.",
                    "auth_error",
                    error_msg
                )
            else:
                return {"pronunciation": 0, "error": f"Speech analysis canceled: {error_msg}"}
        else:
            return {"pronunciation": 0, "error": "Speech analysis failed."}
             
    except APIError:
        raise  # Re-raise APIError to be handled by the caller
    except Exception as e:
        error_msg = str(e)
        
        # Check for common Azure error patterns
        if "429" in error_msg or "rate limit" in error_msg.lower():
            raise APIError(
                "Azure Speech API rate limit exceeded. Please wait a moment and try again.",
                "rate_limit",
                error_msg
            )
        elif "quota" in error_msg.lower() or "exceeded" in error_msg.lower():
            raise APIError(
                "Azure Speech API quota exceeded. The monthly limit has been reached. Please contact the app administrator.",
                "quota_exceeded",
                error_msg
            )
        elif "401" in error_msg or "403" in error_msg or "unauthorized" in error_msg.lower():
            raise APIError(
                "Azure Speech API authentication failed. Please contact the app administrator.",
                "auth_error",
                error_msg
            )
        
        return {"pronunciation": 0, "error": str(e)}
