import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { TreeState } from '../types';

export const HandController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setTreeState, setRotationY, setCameraZoom, setFocusedPhotoId, treeState, focusedPhotoId } = useStore();
  const [loaded, setLoaded] = useState(false);
  
  // Gesture tracking refs
  const lastPinchTime = useRef<number>(0);
  const pinchCount = useRef<number>(0);
  
  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let animationFrameId: number;

    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      setLoaded(true);
      startWebcam();
    };

    const startWebcam = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
          }
        });
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      // Resize canvas to match video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.landmarks && results.landmarks.length > 0) {
           const landmarks = results.landmarks[0];
           
           // Draw
           const drawingUtils = new DrawingUtils(ctx!);
           drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#FFD700", lineWidth: 2 });
           drawingUtils.drawLandmarks(landmarks, { color: "#046307", lineWidth: 1, radius: 3 });

           processGestures(landmarks);
        }
      }
      animationFrameId = window.requestAnimationFrame(predictWebcam);
    };

    const processGestures = (landmarks: any[]) => {
       const thumbTip = landmarks[4];
       const indexTip = landmarks[8];
       const middleTip = landmarks[12];
       const ringTip = landmarks[16];
       const pinkyTip = landmarks[20];
       const wrist = landmarks[0];

       // 1. Calculate Pinch (Thumb + Index) distance
       const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
       const isPinching = pinchDist < 0.05;

       // 2. Calculate Spread (Distance between tips)
       // Simplified: Avg distance from wrist
       const avgDistFromWrist = (
         Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y) +
         Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y)
       ) / 2;
       
       const isFist = avgDistFromWrist < 0.2; // Folded in
       const isSpread = avgDistFromWrist > 0.45; // Wide open

       // Logic Application
       
       // State Change: Fist -> Formed, Spread -> Chaos
       if (isFist) setTreeState(TreeState.FORMED);
       if (isSpread) setTreeState(TreeState.CHAOS);

       // Navigation: One hand visible (assumed if landmarks exist)
       // X Position controls Rotation
       // Invert X because webcam is mirrored usually, but let's stick to standard map
       // x: 0 (left) -> 1 (right)
       const rotation = (1 - wrist.x); 
       setRotationY(rotation);

       // Y Position controls Zoom
       // y: 0 (top) -> 1 (bottom)
       const zoom = 1 - wrist.y; 
       setCameraZoom(zoom);

       // Double Pinch Detection
       if (isPinching) {
          const now = Date.now();
          if (now - lastPinchTime.current > 500) {
             // New pinch sequence start
             pinchCount.current = 1;
             lastPinchTime.current = now;
          } else if (now - lastPinchTime.current > 50) {
             // Subsequent pinch in short window (debounce 50ms)
             pinchCount.current += 1;
             lastPinchTime.current = now;
             
             if (pinchCount.current === 2) {
                 // Trigger Double Pinch Action
                 toggleFocusMode();
                 pinchCount.current = 0; // Reset
             }
          }
       }
    };

    const toggleFocusMode = () => {
        // Toggle between null and a dummy photo ID (in a real app, find closest ornament)
        // Since we don't have raycasting from hand here easily without complex math,
        // we will just toggle the first available photo or a random one.
        const state = useStore.getState();
        if (state.focusedPhotoId) {
            setFocusedPhotoId(null);
        } else if (state.uploadedImages.length > 0) {
             // Focus first image
             const ornamentId = `ornament-0`; // Assuming photo at index 0
             setFocusedPhotoId(ornamentId);
        } else {
            // No photos loaded, maybe flash a message?
            console.log("No photos to focus");
        }
    };

    setup();

    return () => {
      if(animationFrameId) cancelAnimationFrame(animationFrameId);
      if(handLandmarker) handLandmarker.close();
    }
  }, []);

  return (
    <div className="hand-tracker-container absolute bottom-[55px] left-5 z-50 pointer-events-none opacity-80 mix-blend-screen">
       {!loaded && <div className="text-luxury-gold text-xs font-serif animate-pulse">Initializing Vision...</div>}
       <video ref={videoRef} className="hidden" autoPlay playsInline muted></video>
       <canvas ref={canvasRef} className="w-[160px] h-[120px] border border-luxury-gold/30 rounded-lg bg-black/50" />
       <div className="text-[10px] text-luxury-gold/70 mt-1 font-serif text-center w-[160px]">
          Fist: Form • Spread: Chaos • Pinch x2: Focus
       </div>
    </div>
  );
};