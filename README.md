# A.i.ilta_teacher Back Branch

Welcome. Happy hack.

# Guide

테스트시에는 [가상환경](#virtual-machine-run) 만들어서 requirements.txt를 설치한 후 실행하는 것을 권장.

배포 테스트 시에는 도커로 로컬 테스트하고 image 배포 권장.


## Docker run

```
// Docker 이미지 가져와서 실행
sudo docker pull yonghune/cataract-app:0.1
sudo docker images
sudo docker run -d -p 8000:8000 yonghune/cataract-app:0.1
sudo docker ps
```

## Docker build

```
docker build -t <이미지_이름>:<태그> .
docker run -d -p 8000:8000 cataract-app:latest
docker tag cataract-app yonghune/cataract-app:0.2
docker push yonghune/cataract-app:0.2
```

## Virtual Machine run

```
python3 -m venv cataract
source cataract/bin/activate
pip install -r requirements.txt
```

추가로 설치한 라이브러리가 있다. 아래와 같이 requirements 업데이트
```
pip freeze > requirements.txt
```
(주의 : 가상환경이 아닌 로컬환경에서 requirements 업데이트하면 이상한게 덮어 쓰일 수 있으니, 가상환경에서 작업하길 권장)
