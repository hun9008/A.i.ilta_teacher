FROM python:3.12

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libhdf5-dev \
    zlib1g-dev \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app/

RUN pip install --upgrade pip
RUN pip install mediapipe==0.10.14
RUN pip install h5py==3.8.0
RUN pip install tensorflow==2.17.0
RUN pip install protobuf==4.25.4
# RUN curl -fsSL https://ollama.com/install.sh | bash
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8008

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]
# CMD ollama serve & uvicorn main:app --host 0.0.0.0 --port 8008