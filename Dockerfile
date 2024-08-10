FROM python:3.12

WORKDIR /app

COPY . /app/

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install motor
RUN apt-get update -y
RUN apt-get install -y libgl1-mesa-glx
RUN pip install "uvicorn[standard]"
RUN pip install websockets wsproto

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
