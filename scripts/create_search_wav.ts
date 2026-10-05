import fs from 'fs';
import path from 'path';

function createSearchWav() {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSeconds = 11;
  const numSamples = sampleRate * durationSeconds;

  const dataBuffer = Buffer.alloc(numSamples * 2);

  // 4 Arpeggio notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const phraseIntervalSamples = Math.floor(sampleRate * 0.95); // 950ms repeat
  const noteStepSamples = Math.floor(sampleRate * 0.14); // 140ms step

  for (let i = 0; i < numSamples; i++) {
    const timeInPhrase = i % phraseIntervalSamples;
    let sampleVal = 0;

    // Check which note in phrase is playing
    for (let n = 0; n < notes.length; n++) {
      const noteStart = n * noteStepSamples;
      const noteDuration = Math.floor(sampleRate * 0.22); // 220ms percussive decay

      if (timeInPhrase >= noteStart && timeInPhrase < noteStart + noteDuration) {
        const tNote = (timeInPhrase - noteStart) / sampleRate;
        const freq = notes[n];

        // Triangle timbre + Sine fundamental blend
        const triWave = 2 * Math.abs(2 * ((freq * tNote) % 1) - 1) - 1;
        const sineWave = Math.sin(2 * Math.PI * freq * tNote);
        const rawWave = 0.6 * triWave + 0.4 * sineWave;

        // Exponential percussive attack & decay envelope
        const envAttack = Math.min(1, (timeInPhrase - noteStart) / (sampleRate * 0.008));
        const envDecay = Math.exp(-12 * (tNote - 0.008));
        const envelope = envAttack * Math.max(0, envDecay);

        sampleVal += rawWave * envelope * 0.4;
      }
    }

    // Clamp & convert to 16-bit PCM
    const clamped = Math.max(-1, Math.min(1, sampleVal));
    const pcm16 = Math.floor(clamped < 0 ? clamped * 32768 : clamped * 32767);
    dataBuffer.writeInt16LE(pcm16, i * 2);
  }

  // RIFF WAV Header
  const header = Buffer.alloc(44);
  const dataSize = dataBuffer.length;
  const fileSize = 36 + dataSize;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const finalWav = Buffer.concat([header, dataBuffer]);
  const outputPath = path.join(process.cwd(), 'public', 'sounds', 'random_search.wav');
  fs.writeFileSync(outputPath, finalWav);
  console.log('Successfully generated audio file at:', outputPath);
}

createSearchWav();
