# Lambda container image for AI Accent Coach backend
# Uses AWS Lambda Python 3.12 base image (Amazon Linux 2023) with ffmpeg for audio processing
# Python 3.12 uses AL2023 which has GLIBC 2.34, required for Azure Speech SDK

FROM public.ecr.aws/lambda/python:3.12

# Install ffmpeg for audio conversion (pydub dependency)
# Using dnf package manager (Amazon Linux 2023)
RUN dnf update -y && \
    dnf install -y tar xz && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz && \
    tar -xf /tmp/ffmpeg.tar.xz -C /tmp && \
    mv /tmp/ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    mv /tmp/ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ && \
    rm -rf /tmp/ffmpeg* && \
    dnf clean all

# Install Python dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Install Mangum for Lambda/FastAPI integration
RUN pip install --no-cache-dir mangum

# Copy application code
COPY main.py ${LAMBDA_TASK_ROOT}/
COPY grading_engine.py ${LAMBDA_TASK_ROOT}/
COPY coaching_engine.py ${LAMBDA_TASK_ROOT}/
COPY auth.py ${LAMBDA_TASK_ROOT}/
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD ["lambda_handler.handler"]

