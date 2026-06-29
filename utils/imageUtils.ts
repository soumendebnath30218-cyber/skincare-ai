// utils/imageUtils.ts

export function checkImageBrightness(imageElement: HTMLImageElement): number {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0; // TypeScript-এর সেফটি চেক

    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let colorSum = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     
        const g = data[i + 1]; 
        const b = data[i + 2]; 
        
        const brightness = (r + g + b) / 3;
        colorSum += brightness;
    }

    const totalPixels = data.length / 4;
    return Math.round(colorSum / totalPixels); 
}     