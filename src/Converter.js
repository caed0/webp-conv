const fs = require('fs');
const path = require('path');
const { Image } = require("node-webpmux");
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const { loadImage, createCanvas } = require('canvas');

class Converter {
  async convert(input, output, options = {}) {
    if(!input) throw new Error("Input is required");
    if(!output) throw new Error("Output is required");
    if(!fs.existsSync(input)) throw new Error("Input file does not exist");
    if(!fs.statSync(input).isFile()) throw new Error("Input is not a file");
    if(path.extname(input) !== '.webp') throw new Error("Input file is not a webp file");
    if(path.extname(output) !== '.gif' && path.extname(output) !== '.png') throw new Error("Output file is not a gif or png file");
    
    for(let key in options) {
      if(key !== 'quality' && key !== 'transparent') throw new Error(`Invalid option parameter: ${key}`);
    }

    const quality = options.quality || 10;
    const transparent = options.transparent || '0x000000';

    if(output.endsWith('.png')) return output && fs.copyFileSync(input, output);
    
    const img = new Image();
    await img.load(input);
    await img.initLib();
    const { width, height, data } = img;
    const frames = data.anim.frames;

    const encoder = new GIFEncoder(width, height);
    encoder.createReadStream().pipe(fs.createWriteStream(output));
    encoder.start();
    encoder.setRepeat(data.anim.loops);
    encoder.setTransparent(transparent);
    encoder.setQuality(quality);

    for(let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameData = await img.getFrameData(i);
      const png = new PNG({ width: frame.width, height: frame.height });

      for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
              const idx = (width * y + x) * 4;
              png.data[idx] = frameData[idx];
              png.data[idx + 1] = frameData[idx + 1];
              png.data[idx + 2] = frameData[idx + 2];
              png.data[idx + 3] = frameData[idx + 3] < 128 ? 0 : frameData[idx + 3];
          }
      }

      const image = await loadImage('data:image/png;base64,' + PNG.sync.write(png).toString('base64'));
      const ctx = createCanvas(width, height).getContext('2d');
      ctx.drawImage(image, 2 * frame.x, 2 * frame.y, frame.width, frame.height);

      encoder.setDelay(frame.delay);
      encoder.addFrame(ctx);
    }

    encoder.finish();
    return output;
  }
}

module.exports = Converter;