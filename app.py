import streamlit as st
from audio_recorder_streamlit import audio_recorder
import os
from grading_engine import get_pronunciation_score
from coaching_engine import get_coaching_tips
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page Setup
st.set_page_config(page_title="Accent Coach", layout="centered")
st.title("🎙️ AI Accent Coach")
st.write("Read the reference sentence below clearly to analyze your accent.")

# 1. The Challenge Text
# In a real app, this could be dynamic or fetched from a database
reference_text = "The quick brown fox jumps over the lazy dog."
st.markdown(f"### 📖 Reference Text:\n> **{reference_text}**")

# 2. Input (Audio Recording)
st.info("Click the microphone to record. It will stop automatically when you pause.")
audio_bytes = audio_recorder(pause_threshold=2.0)

if audio_bytes:
    st.audio(audio_bytes, format="audio/wav")
    
    with st.spinner("Analyzing your pronunciation..."):
        # Save temp file for the API to read (Azure SDK reads from disk)
        temp_filename = "temp_audio.wav"
        with open(temp_filename, "wb") as f:
            f.write(audio_bytes)

        # 3. Grading (The "Ear" - Azure)
        scores = get_pronunciation_score(temp_filename, reference_text)
        
        # Display Metrics
        col1, col2, col3 = st.columns(3)
        col1.metric("Pronunciation", f"{scores.get('pronunciation', 0)}/100")
        col2.metric("Fluency", f"{scores.get('fluency', 0)}/100")
        col3.metric("Completeness", f"{scores.get('completeness', 0)}/100")

        # Show mock mode indicator if applicable
        if scores.get('mock_data'):
            st.warning(f"ℹ️ {scores.get('details', 'Running in demo mode')}")

        # 4. Coaching (The "Brain" - OpenAI)
        if scores.get('pronunciation', 0) > 0:
            tips = get_coaching_tips(reference_text, scores)
            st.success("🤖 Coach's Feedback:")
            st.markdown(tips)
        elif "error" in scores:
            st.error(f"Error: {scores['error']}")
        else:
            st.error("Could not analyze audio. Please try again.")

        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
