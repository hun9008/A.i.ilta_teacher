FROM python:3.12

WORKDIR /app

COPY . /app/

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8006

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
