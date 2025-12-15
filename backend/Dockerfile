# Lambda container image for AI Accent Coach backend
# Uses AWS Lambda Python base image with ffmpeg for audio processing

FROM public.ecr.aws/lambda/python:3.11

# Install ffmpeg for audio conversion (pydub dependency)
# Using Amazon Linux 2 package manager
RUN yum update -y && \
    yum install -y tar xz && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz && \
    tar -xf /tmp/ffmpeg.tar.xz -C /tmp && \
    mv /tmp/ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    mv /tmp/ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ && \
    rm -rf /tmp/ffmpeg* && \
    yum clean all

# Install Python dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Install Mangum for Lambda/FastAPI integration
RUN pip install --no-cache-dir mangum

# Copy application code
COPY main.py ${LAMBDA_TASK_ROOT}/
COPY grading_engine.py ${LAMBDA_TASK_ROOT}/
COPY coaching_engine.py ${LAMBDA_TASK_ROOT}/
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD ["lambda_handler.handler"]

