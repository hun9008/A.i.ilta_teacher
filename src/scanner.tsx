import { useEffect, useState, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
declare var cv: any;

function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: 'user',
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
      });

    return () => {
      stopStreaming();
    };
  }, []);

  const stopStreaming = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) {
      console.error('Video element not found.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const capturedImageUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(capturedImageUrl);
      processFrame(canvas);
    }
  };
  const processFrame = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const src = cv.matFromImageData(imageData);

      // Convert to grayscale
      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      // Apply GaussianBlur to smooth the image and reduce noise
      let blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Apply adaptive threshold to get binary image
      let binary = new cv.Mat();
      cv.adaptiveThreshold(
        blurred,
        binary,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );

      // Optional: Apply morphological operations to reduce noise
      let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
      let morphed = new cv.Mat();
      cv.morphologyEx(binary, morphed, cv.MORPH_CLOSE, kernel);

      // Convert the processed image back to canvas
      cv.imshow(canvas, morphed);

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();
      binary.delete();
      morphed.delete();
      kernel.delete();

      setProcessedImage(canvas.toDataURL('image/jpeg'));
    }
  };

  return (
    <div>
      <div>
        <img src={LaptopImage} style={{ width: '100px', height: '100px' }} />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '300px', height: '300px' }}
        ></video>

        <div className="button-container">
          <button id="captureButton" className="button" onClick={captureFrame}>
            Capture
          </button>
        </div>

        {capturedImage && (
          <div>
            <h2>Captured Image:</h2>
            <img src={capturedImage} alt="Captured" />
          </div>
        )}

        {processedImage && (
          <div>
            <h2>Processed Image:</h2>
            <img src={processedImage} alt="Processed" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanPage;

// import { useEffect, useState, useRef } from 'react';
// import LaptopImage from './assets/Laptop.jpg';

// function ScanPage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   const [processedImage, setProcessedImage] = useState<string | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   useEffect(() => {
//     const constraints = {
//       video: {
//         facingMode: 'user',
//       },
//     };

//     navigator.mediaDevices
//       .getUserMedia(constraints)
//       .then((stream) => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           localStreamRef.current = stream;
//         }
//       })
//       .catch((err) => {
//         console.error('Error accessing camera: ', err);
//       });

//     return () => {
//       stopStreaming();
//     };
//   }, []);

//   const stopStreaming = () => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//       localStreamRef.current = null;
//     }
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//   };

//   const captureFrame = async () => {
//     if (!videoRef.current) {
//       console.error('Video element not found.');
//       return;
//     }

//     const canvas = document.createElement('canvas');
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//       const capturedImageUrl = canvas.toDataURL('image/jpeg');
//       setCapturedImage(capturedImageUrl);
//       processFrame(canvas);
//     }
//   };

//   const processFrame = (canvas: HTMLCanvasElement) => {
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       // Grayscale conversion
//       const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const grayImage = new ImageData(canvas.width, canvas.height);
//       for (let i = 0; i < imgData.data.length; i += 4) {
//         const avg =
//           (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
//         grayImage.data[i] = avg;
//         grayImage.data[i + 1] = avg;
//         grayImage.data[i + 2] = avg;
//         grayImage.data[i + 3] = imgData.data[i + 3];
//       }
//       ctx.putImageData(grayImage, 0, 0);

//       // Adaptive Thresholding
//       const imgDataGray = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const thresholdImage = new ImageData(canvas.width, canvas.height);
//       for (let i = 0; i < imgDataGray.data.length; i += 4) {
//         const threshold = imgDataGray.data[i] > 128 ? 255 : 0;
//         thresholdImage.data[i] = threshold;
//         thresholdImage.data[i + 1] = threshold;
//         thresholdImage.data[i + 2] = threshold;
//         thresholdImage.data[i + 3] = imgDataGray.data[i + 3];
//       }
//       ctx.putImageData(thresholdImage, 0, 0);

//       // Contrast adjustment
//       const contrast = 1.5; // You can adjust this value
//       const intercept = 128 * (1 - contrast);
//       const contrastedImage = ctx.getImageData(
//         0,
//         0,
//         canvas.width,
//         canvas.height
//       );
//       for (let i = 0; i < contrastedImage.data.length; i += 4) {
//         contrastedImage.data[i] =
//           contrastedImage.data[i] * contrast + intercept;
//         contrastedImage.data[i + 1] =
//           contrastedImage.data[i + 1] * contrast + intercept;
//         contrastedImage.data[i + 2] =
//           contrastedImage.data[i + 2] * contrast + intercept;
//       }
//       ctx.putImageData(contrastedImage, 0, 0);

//       setProcessedImage(canvas.toDataURL('image/jpeg'));
//     }
//   };

//   return (
//     <div>
//       <div>
//         <img src={LaptopImage} style={{ width: '100px', height: '100px' }} />

//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           style={{ width: '300px', height: '300px' }}
//         ></video>

//         <div className="button-container">
//           <button id="captureButton" className="button" onClick={captureFrame}>
//             Capture
//           </button>
//         </div>

//         {capturedImage && (
//           <div>
//             <h2>Captured Image:</h2>
//             <img src={capturedImage} alt="Captured" />
//           </div>
//         )}

//         {processedImage && (
//           <div>
//             <h2>Processed Image:</h2>
//             <img src={processedImage} alt="Processed" />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ScanPage;
