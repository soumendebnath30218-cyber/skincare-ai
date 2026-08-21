import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glowryai.app',
  appName: 'GlowryAI',
  webDir: 'public',
  
  server: {
    url: 'https://skincare-ai-eight.vercel.app/',
    cleartext: true
  }
};

export default config;