import os
import io
import wave
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydub import AudioSegment

from grading_engine import get_pronunciation_score
from coaching_engine import get_coaching_tips


def convert_to_wav(input_path: str, output_path: str) -> bool:
    """
    Convert any audio format to WAV format that Azure Speech SDK accepts.
    Azure requires: PCM, 16kHz, 16-bit, mono, with proper RIFF header.
    """
    try:
        # Load audio with pydub (uses ffmpeg under the hood)
        audio = AudioSegment.from_file(input_path)
        
        # Convert to Azure-compatible format: 16kHz, mono, 16-bit
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        
        # Get raw PCM data
        raw_data = audio.raw_data
        
        # Write proper WAV file using wave module (guarantees correct header)
        with wave.open(output_path, 'wb') as wav_file:
            wav_file.setnchannels(1)          # Mono
            wav_file.setsampwidth(2)          # 16-bit (2 bytes)
            wav_file.setframerate(16000)      # 16kHz
            wav_file.writeframes(raw_data)
        
        # Verify the file was created and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 44:  # 44 = WAV header size
            print(f"Audio converted successfully: {os.path.getsize(output_path)} bytes")
            return True
        else:
            print("Audio conversion produced empty or invalid file")
            return False
            
    except Exception as e:
        print(f"Audio conversion error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Accent Coach API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample sentences for practice
PRACTICE_SENTENCES = [
    {
        "id": 1,
        "text": "The quick brown fox jumps over the lazy dog.",
        "difficulty": "easy",
        "focus": "General pronunciation"
    },
    {
        "id": 2,
        "text": "She sells seashells by the seashore.",
        "difficulty": "medium",
        "focus": "S and SH sounds"
    },
    {
        "id": 3,
        "text": "Peter Piper picked a peck of pickled peppers.",
        "difficulty": "medium",
        "focus": "P sounds and rhythm"
    },
    {
        "id": 4,
        "text": "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
        "difficulty": "hard",
        "focus": "W sounds and tongue twisters"
    },
    {
        "id": 5,
        "text": "The thirty-three thieves thought that they thrilled the throne throughout Thursday.",
        "difficulty": "hard",
        "focus": "TH sounds"
    }
]


@app.get("/")
async def root():
    return {"message": "AI Accent Coach API", "status": "running"}


@app.get("/api/sentences")
async def get_sentences():
    """Get list of practice sentences"""
    return {"sentences": PRACTICE_SENTENCES}


@app.post("/api/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    reference_text: str = Form(...)
):
    """
    Analyze pronunciation from audio file.
    Returns scores and coaching tips.
    """
    temp_input = None
    temp_wav = None
    
    try:
        # Save uploaded audio to temp file (browser sends webm/ogg, not wav)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_input = temp_file.name

        # Convert to proper WAV format for Azure Speech SDK
        temp_wav = temp_input.replace(".webm", "_converted.wav")
        if not convert_to_wav(temp_input, temp_wav):
            raise HTTPException(status_code=400, detail="Failed to process audio. Please try recording again.")

        # Get pronunciation scores from Azure
        scores = get_pronunciation_score(temp_wav, reference_text)
        
        # Check for errors
        if "error" in scores and scores.get("pronunciation", 0) == 0:
            raise HTTPException(status_code=400, detail=scores["error"])
        
        # Get coaching tips from OpenAI
        coaching = get_coaching_tips(reference_text, scores)
        
        return {
            "scores": {
                "pronunciation": scores.get("pronunciation", 0),
                "fluency": scores.get("fluency", 0),
                "completeness": scores.get("completeness", 0)
            },
            "coaching": coaching,
            "mock_mode": scores.get("mock_data", False),
            "mock_details": scores.get("details", None)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp files
        if temp_input and os.path.exists(temp_input):
            os.unlink(temp_input)
        if temp_wav and os.path.exists(temp_wav):
            os.unlink(temp_wav)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "azure_configured": bool(os.getenv("AZURE_SPEECH_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }
