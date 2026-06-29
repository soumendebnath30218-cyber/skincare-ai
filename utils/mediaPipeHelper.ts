import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// 🛡️ THE PERMANENT GLOBAL SHIELD 🛡️
// এই কোডটা ব্রাউজারের কনসোলকে পারমানেন্টলি ফিল্টার করবে
if (typeof window !== "undefined") {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
        if (typeof args[0] === 'string' && (args[0].includes('XNNPACK') || args[0].includes('TensorFlow Lite'))) {
            return; // মেসেজটা গিলে ফেলবে, Next.js-কে দেখতেই দেবে না!
        }
        originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
        if (typeof args[0] === 'string' && (args[0].includes('XNNPACK') || args[0].includes('TensorFlow Lite'))) {
            return;
        }
        originalConsoleWarn.apply(console, args);
    };
}

// --------------------------------------------------------

let faceLandmarker: FaceLandmarker | null = null;

export async function initializeMediaPipe() {
    if (faceLandmarker) return faceLandmarker;

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU" // দ্রুত স্ক্যান করার জন্য GPU ব্যবহার
        },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1 
    });

    console.log("✅ MediaPipe Face Scanner Ready!");
    return faceLandmarker;
}

export async function scanFaceWithMediaPipe(imageElement: HTMLImageElement) {
    if (!faceLandmarker) {
        await initializeMediaPipe();
    }
    
    // আসল স্ক্যানিং
    const result = faceLandmarker?.detect(imageElement);
    return result;
}