const fs = require('fs');
const path = require('path');
const { Image } = require("node-webpmux");
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const { loadImage, createCanvas } = require('canvas');

class Converter {
  async convert(input, output = '.', options = {}) {
    if(!fs.existsSync(output)) throw new Error("Output folder does not exist");
    if(fs.existsSync(input) || fs.existsSync(input[0])) throw new Error("Input file does not exist");
    const { quality = 10, transparent = '0x000000' } = options;

    let inputPaths;
    if(Array.isArray(input)) inputPaths = input;
    else {
      const stat = fs.statSync(input);
      if(stat.isFile()) inputPaths.push(input);
      else if(stat.isDirectory()) {
        const files = fs.readdirSync(input);
        for(let i = 0; i < files.length; i++) {
          const statF = fs.statSync(input);
          if(!statF.isFile()) return;
          inputPaths.push(path.join(input, files[i]))
        }
      }
    }


    for(let i = 0; i < inputPaths; i++) {
      const img = new Image();
      await img.load(inputPaths[i]);

      let outputPath = path.join(output,`${path.basename(inputPaths[i], path.extname(inputPaths[i]))}_converted.${(img.hasAnim ? 'gif' : 'png')}`);
      if(outputPath.endsWith('.png')) {
        fs.copyFileSync(inputPaths[i], outputPath);
        return outputPath;
      }
  
      await img.initLib();
      const { width, height, data } = img;
      const frames = data.anim.frames;
  
      const encoder = new GIFEncoder(width, height);
      encoder.createReadStream().pipe(fs.createWriteStream(outputPath));
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
      return outputPath;
    }
  }
}

module.exports = Converter;