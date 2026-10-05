import fs from 'fs';
import path from 'path';

function writeWavHeader(dataSize: number, sampleRate = 44100, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const fileSize = 36 + dataSize;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

function generateSoundFiles() {
  const soundsDir = path.join(process.cwd(), 'public', 'sounds');
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
  }

  const sampleRate = 44100;

  // 1. match_found.wav (A major fanfare chord sequence)
  {
    const duration = 0.8;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);
    const freqs = [440, 554.37, 659.25, 880];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((f, idx) => {
        const startT = idx * 0.08;
        if (t >= startT) {
          const tNote = t - startT;
          const tri = 2 * Math.abs(2 * ((f * tNote) % 1) - 1) - 1;
          const env = Math.exp(-6 * tNote);
          val += tri * env * 0.25;
        }
      });
      const clamped = Math.max(-1, Math.min(1, val));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'match_found.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  // 2. select.wav (Crisp option lock chime)
  {
    const duration = 0.15;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 523.25 + (1046.5 - 523.25) * (t / duration);
      const sine = Math.sin(2 * Math.PI * freq * t);
      const env = Math.exp(-20 * t);
      const clamped = Math.max(-1, Math.min(1, sine * env * 0.4));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'select.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  // 3. correct.wav (Happy major arpeggio C5-E5-G5-C6)
  {
    const duration = 0.6;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);
    const freqs = [523.25, 659.25, 783.99, 1046.50];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((f, idx) => {
        const startT = idx * 0.07;
        if (t >= startT) {
          const tNote = t - startT;
          const sine = Math.sin(2 * Math.PI * f * tNote);
          const env = Math.exp(-8 * tNote);
          val += sine * env * 0.25;
        }
      });
      const clamped = Math.max(-1, Math.min(1, val));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'correct.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  // 4. wrong.wav (Soft comfortable descending tone)
  {
    const duration = 0.35;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 180 * Math.exp(-2 * t);
      const tri = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
      const sine = Math.sin(2 * Math.PI * (freq * 0.75) * t);
      const env = Math.exp(-6 * t);
      const val = (tri * 0.6 + sine * 0.4) * env * 0.35;
      const clamped = Math.max(-1, Math.min(1, val));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'wrong.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  // 5. tick.wav (Timer tick sound)
  {
    const duration = 0.08;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 900 * Math.exp(-15 * t);
      const sine = Math.sin(2 * Math.PI * freq * t);
      const env = Math.exp(-40 * t);
      const clamped = Math.max(-1, Math.min(1, sine * env * 0.35));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'tick.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  // 6. lifeline.wav (Lifeline activation sweep)
  {
    const duration = 0.3;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 350 * Math.exp(4.5 * t);
      const sine = Math.sin(2 * Math.PI * freq * t);
      const env = Math.exp(-8 * t);
      const clamped = Math.max(-1, Math.min(1, sine * env * 0.35));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'lifeline.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  // 7. victory.wav (Grand victory arpeggio)
  {
    const duration = 1.0;
    const numSamples = Math.floor(sampleRate * duration);
    const buf = Buffer.alloc(numSamples * 2);
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((f, idx) => {
        const startT = idx * 0.09;
        if (t >= startT) {
          const tNote = t - startT;
          const tri = 2 * Math.abs(2 * ((f * tNote) % 1) - 1) - 1;
          const env = Math.exp(-5 * tNote);
          val += tri * env * 0.2;
        }
      });
      const clamped = Math.max(-1, Math.min(1, val));
      buf.writeInt16LE(Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767), i * 2);
    }
    fs.writeFileSync(path.join(soundsDir, 'victory.wav'), Buffer.concat([writeWavHeader(buf.length), buf]));
  }

  console.log('All sound files generated in public/sounds directory successfully!');
}

generateSoundFiles();
