from pydantic import BaseModel
import numpy as np
import cv2
import base64

class ProbAreas_HandImg(BaseModel):
    image_clean : str
    image_hand : str

class HandArea_HandImg(BaseModel):
    image : str

class ImageInput(BaseModel):
    origin_image: str  # Base64 인코딩된 이미지
    hand_image: str    # Base64 인코딩된 이미지

    def decode_image(self, base64_str: str) -> np.ndarray:
        """
        Base64 인코딩된 이미지를 numpy.ndarray로 디코딩하는 함수
        :param base64_str: Base64 인코딩된 이미지 문자열
        :return: numpy.ndarray 형태의 이미지
        """
        image_data = base64.b64decode(base64_str)
        image_np = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        return image

    def get_origin_image(self) -> np.ndarray:
        return self.decode_image(self.origin_image)

    def get_hand_image(self) -> np.ndarray:
        return self.decode_image(self.hand_image)