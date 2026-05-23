# Stage 1: Fast virtual environment compilation using Astral UV
FROM ghcr.io/astral-sh/uv:python3.12-alpine AS builder

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

# Build and mount cache to resolve dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    uv venv /venv && \
    . /venv/bin/activate && \
    uv pip install -r requirements.txt

# Stage 2: Runtime image
FROM python:3.12-alpine

WORKDIR /app

# Copy compiled dependencies
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

# Copy Flask backend codebase files
COPY . .

EXPOSE 5000

# Production variables
ENV FLASK_APP=run.py
ENV FLASK_ENV=production

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app", "--workers", "4", "--threads", "2"]
