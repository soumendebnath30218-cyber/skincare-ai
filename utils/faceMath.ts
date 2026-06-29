// utils/faceMath.ts

// দুটি পয়েন্টের দূরত্ব মাপার ফর্মুলা
function getDistance(point1: any, point2: any) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// সিমেট্রি এবং বেস স্কোর বের করার মেইন ফাংশন
export function calculateFaceScore(landmarks: any[]) {
    if (!landmarks || landmarks.length === 0) return { symmetry: 0, baseScore: 0 };

    const face = landmarks[0]; // প্রথম মুখের পয়েন্টগুলো

    // MediaPipe-এর ইনডেক্স অনুযায়ী পয়েন্ট (নাক, বাম চোখ, ডান চোখ)
    const noseTip = face[1];
    const leftEye = face[33];
    const rightEye = face[263];

    // নাক থেকে চোখের দূরত্ব মাপা
    const leftDistance = getDistance(noseTip, leftEye);
    const rightDistance = getDistance(noseTip, rightEye);

    // সিমেট্রি (Symmetry) ক্যালকুলেশন
    const diff = Math.abs(leftDistance - rightDistance);
    const maxDist = Math.max(leftDistance, rightDistance);
    
    let symmetryPercent = 100 - (diff / maxDist) * 100;
    
    // সিমেট্রিকে ড্যাশবোর্ডের জন্য সুন্দর ফরম্যাটে আনা (যেমন: 88.5)
    symmetryPercent = Number(symmetryPercent.toFixed(1));

    // ৪০% ওয়েটেজ অনুযায়ী একটা বেস স্ট্রাকচারাল স্কোর তৈরি (১০ এর মধ্যে)
    const baseScore = Number(((symmetryPercent / 100) * 10).toFixed(1));

    return {
        symmetry: symmetryPercent,
        baseScore: baseScore
    };
}