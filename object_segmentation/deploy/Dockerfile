FROM python:3.12

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app/

RUN pip install --upgrade pip
RUN pip install tensorflow
RUN curl -fsSL https://ollama.com/install.sh | bash
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8008

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]