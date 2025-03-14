const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { Image } = require("node-webpmux");
const GIFEncoder = require('gif-encoder-2');
const { loadImage, createCanvas } = require('canvas');
const os = require("os");

class Converter {
  #BINARIES = path.join(path.resolve(__dirname, '..'), 'libwebp', 'bin');
  #ANIM_DUMP = path.join(this.#BINARIES, 'anim_dump');
  #DWEBP = path.join(this.#BINARIES, 'dwebp');

  async convert(input, output, options = {}) {
    if(!input) throw new Error("Input is required");
    if(!output) throw new Error("Output is required");
    if(!fs.existsSync(input)) throw new Error(`Input file does not exist (${__dirname + input})`);
    if(!fs.statSync(input).isFile()) throw new Error("Input is not a file");
    if(path.extname(input) !== '.webp') throw new Error("Input file is not a webp file");
    if(path.extname(output) !== '.gif' && path.extname(output) !== '.png') throw new Error("Output file is not a gif or png file");
    
    for(let key in options) if(key !== 'quality' && key !== 'transparent') throw new Error(`Invalid option parameter: ${key}`);

    const quality = options.quality || 10;
    const transparent = options.transparent || '0x000000';

    if(output.endsWith('.png')) {
      await execFile(this.#DWEBP, [input, '-o', output], (error) => {
        if (error) return console.error(`Error executing anim_dump: ${error}`);
      });

      return output;
    }

    const img = new Image();
    await img.load(input);
    await img.initLib();
    const { width, height, data } = img;
    const rawFrames = data.anim.frames;

    const encoder = new GIFEncoder(width, height, 'neuquant', true, rawFrames.length);
    encoder.createReadStream().pipe(fs.createWriteStream(output));
    encoder.start();
    encoder.setRepeat(data.anim.loops);
    encoder.setTransparent(transparent);
    encoder.setQuality(quality);

    const folder = path.join(os.tmpdir(), 'webp-conv', path.basename(input));
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true });
    fs.mkdirSync(folder, { recursive: true });

    await execFile(this.#ANIM_DUMP, ['-folder', folder, input], (error) => {
      if (error) return console.error(`Error executing anim_dump: ${error}`);
    });

    while (fs.readdirSync(folder).length !== Object.keys(rawFrames).length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const frames = fs.readdirSync(folder).filter(file => path.extname(file) === '.png');

    for(let i = 0; i < frames.length; i++) {
      const framePath = path.join(folder, frames[i]);
      const ctx = createCanvas(width, height).getContext('2d');
      const image = await loadImage(framePath);
      ctx.drawImage(image, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0 && data[i + 3] < 128) data[i + 3] = 0;
      }

      // Put the modified pixel data back onto the canvas
      ctx.putImageData(imageData, 0, 0);

      encoder.setDelay(rawFrames[i].delay);
      encoder.addFrame(ctx);
    }

    fs.rmSync(folder, { recursive: true });
    encoder.finish();
    return output;
  }
}

module.exports = Converter;