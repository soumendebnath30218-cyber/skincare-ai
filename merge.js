const fs = require('fs');
const path = require('path');

const outputFile = 'full_codebase.txt';
// যে ফোল্ডার এবং ফাইলগুলো আমরা স্ক্যান করতে চাই
const targets = ['app', 'components', 'utils', 'middleware.ts', 'package.json'];

let content = '';

function readFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const stat = fs.statSync(dir);
    
    if (stat.isFile()) {
        // শুধু .ts, .tsx এবং .json ফাইলগুলো নেব
        if (dir.endsWith('.ts') || dir.endsWith('.tsx') || dir.endsWith('.json')) {
            content += `\n\n// ==========================================\n`;
            content += `// File: ${dir.replace(/\\/g, '/')}\n`;
            content += `// ==========================================\n\n`;
            content += fs.readFileSync(dir, 'utf-8');
        }
        return;
    }
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        readFiles(path.join(dir, file));
    });
}

// স্ক্রিপ্ট রান করা হচ্ছে
targets.forEach(target => readFiles(target));
fs.writeFileSync(outputFile, content);
console.log('✅ Success! full_codebase.txt is ready.');