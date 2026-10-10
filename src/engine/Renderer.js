const WIDTH = 320;
const HEIGHT = 180;

const COLORS = {
  ink: '#171225',
  night: '#252143',
  navy: '#30335e',
  blue: '#426a9c',
  sky: '#78afd0',
  cloud: '#c7d9d5',
  cream: '#f2d69b',
  warm: '#f2ad68',
  red: '#b95656',
  rust: '#754447',
  greenDeep: '#173d35',
  green: '#2d6a4f',
  grass: '#5c9660',
  paddy: '#a2ac58',
  field: '#c3bb69',
  brownDark: '#392a2d',
  brown: '#715044',
  tan: '#ae805a',
  rail: '#a7a8aa',
  ballast: '#4e4d5a',
  trainBlue: '#3e6392',
  window: '#f6c66e',
  black: '#10101c',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = (value, size) => ((value % size) + size) % size;

function rect(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
}

function pixel(context, x, y, color) {
  rect(context, x, y, 1, 1, color);
}

function pixelCircle(context, centerX, centerY, radius, color) {
  context.fillStyle = color;
  for (let y = -radius; y <= radius; y += 1) {
    const halfWidth = Math.floor(Math.sqrt(radius * radius - y * y));
    context.fillRect(centerX - halfWidth, centerY + y, halfWidth * 2 + 1, 1);
  }
}

function repeatAcross(offset, spacing, drawItem) {
  const start = -spacing - wrap(offset, spacing);
  for (let x = start; x < WIDTH + spacing; x += spacing) drawItem(x);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
  }

  render(state) {
    const context = this.context;
    context.clearRect(0, 0, WIDTH, HEIGHT);

    this.drawSky(context, state);
    this.drawDistantLayer(context, state.worldOffset);
    this.drawMiddleLayer(context, state.worldOffset);
    this.drawTrack(context, state.worldOffset);
    this.drawTrain(context, state);
    this.drawForeground(context, state.worldOffset);

    // A small pause indicator belongs on the canvas so the simulation state
    // remains obvious even if someone hides the HTML controls.
    if (state.paused) this.drawPauseBadge(context);
  }

  drawSky(context, state) {
    rect(context, 0, 0, WIDTH, 180, COLORS.sky);
    rect(context, 0, 0, WIDTH, 24, '#527ea9');
    rect(context, 0, 24, WIDTH, 22, '#6095ba');
    rect(context, 0, 46, WIDTH, 26, '#70a8c7');
    rect(context, 0, 72, WIDTH, 32, '#83b7c9');

    // Sun and blocky cloud banks are intentionally made from rectangles and
    // pixel circles, keeping the image sharp at the low internal resolution.
    pixelCircle(context, 257, 31, 10, COLORS.warm);
    rect(context, 247, 31, 20, 3, COLORS.warm);
    rect(context, 251, 21, 12, 22, COLORS.warm);

    const cloudOffset = state.worldOffset * 0.08;
    repeatAcross(cloudOffset, 150, (x) => this.drawCloud(context, x + 18, 28));
    repeatAcross(cloudOffset * 0.6 + 60, 205, (x) => this.drawCloud(context, x + 44, 54, true));
  }

  drawCloud(context, x, y, small = false) {
    const scale = small ? 0.7 : 1;
    const color = small ? '#a9cbd0' : COLORS.cloud;
    rect(context, x, y + 6 * scale, 29 * scale, 5 * scale, color);
    rect(context, x + 5 * scale, y + 3 * scale, 18 * scale, 7 * scale, color);
    rect(context, x + 11 * scale, y, 9 * scale, 9 * scale, color);
    rect(context, x + 19 * scale, y + 5 * scale, 9 * scale, 6 * scale, color);
    rect(context, x + 2 * scale, y + 10 * scale, 32 * scale, 2 * scale, color);
  }

  drawDistantLayer(context, offset) {
    rect(context, 0, 97, WIDTH, 25, '#6b927d');

    repeatAcross(offset * 0.18, 190, (x) => {
      this.drawHill(context, x, 102, 104, 38, '#4c7080');
      this.drawHill(context, x + 79, 105, 80, 32, '#527c7b');
    });

    // Distant strips of fields make the horizon easier to read.
    rect(context, 0, 116, WIDTH, 13, '#719364');
    for (let x = -12 - wrap(offset * 0.22, 16); x < WIDTH; x += 16) {
      rect(context, x, 119, 8, 1, '#8eaa68');
      rect(context, x + 5, 123, 9, 1, '#5c805c');
    }
  }

  drawHill(context, x, base, width, height, color) {
    for (let column = 0; column < width; column += 4) {
      const curve = Math.sin((column / width) * Math.PI) ** 0.75;
      const top = Math.floor(base - curve * height);
      rect(context, x + column, top, 5, HEIGHT - top, color);
    }
    rect(context, x + 22, base - height + 8, 5, 4, '#6b927d');
  }

  drawMiddleLayer(context, offset) {
    rect(context, 0, 127, WIDTH, 24, COLORS.paddy);

    // Paddy rows scroll more slowly than the railway-side plants.
    for (let x = -18 - wrap(offset * 0.48, 18); x < WIDTH + 18; x += 18) {
      rect(context, x, 129, 10, 1, '#c9c675');
      rect(context, x + 5, 134, 11, 1, '#829956');
      rect(context, x - 2, 141, 13, 1, '#d0c777');
    }

    repeatAcross(offset * 0.52, 82, (x) => {
      this.drawTree(context, x + 18, 133, 20, COLORS.greenDeep);
      this.drawTree(context, x + 48, 137, 14, COLORS.green);
    });

    repeatAcross(offset * 0.5 + 32, 220, (x) => {
      this.drawHouse(context, x + 24, 137, false);
      rect(context, x + 10, 134, 18, 1, COLORS.brown);
    });

    // Thin field boundaries add horizontal movement without competing with
    // the train.
    rect(context, 0, 148, WIDTH, 2, '#778650');
    for (let x = -20 - wrap(offset * 0.65, 28); x < WIDTH; x += 28) {
      rect(context, x, 145, 1, 5, COLORS.green);
      rect(context, x + 1, 145, 7, 1, COLORS.green);
    }
  }

  drawTree(context, x, base, height, color) {
    const trunkHeight = Math.max(5, Math.floor(height * 0.55));
    rect(context, x - 1, base - trunkHeight, 3, trunkHeight, COLORS.brownDark);
    rect(context, x - 7, base - height + 6, 15, 8, color);
    rect(context, x - 11, base - height + 11, 23, 7, color);
    rect(context, x - 5, base - height, 10, 8, color);
    pixel(context, x - 7, base - height + 9, COLORS.grass);
    pixel(context, x + 7, base - height + 13, COLORS.grass);
  }

  drawHouse(context, x, base, lit) {
    rect(context, x, base - 10, 29, 10, COLORS.tan);
    rect(context, x + 3, base - 7, 6, 7, COLORS.cream);
    rect(context, x + 20, base - 7, 5, 5, lit ? COLORS.warm : COLORS.brownDark);
    rect(context, x - 3, base - 12, 35, 3, COLORS.rust);
    rect(context, x + 2, base - 15, 25, 3, COLORS.rust);
    rect(context, x + 8, base - 18, 13, 3, COLORS.rust);
    rect(context, x + 13, base - 21, 4, 3, COLORS.brownDark);
    rect(context, x - 4, base, 37, 2, COLORS.brownDark);
  }

  drawTrack(context, offset) {
    // Embankment and ballast.
    rect(context, 0, 149, WIDTH, 31, COLORS.brown);
    rect(context, 0, 150, WIDTH, 12, COLORS.ballast);
    rect(context, 0, 163, WIDTH, 17, COLORS.brownDark);

    // Sleepers repeat with the track's world movement.
    for (let x = -8 - wrap(offset, 12); x < WIDTH + 12; x += 12) {
      rect(context, x, 150, 7, 16, COLORS.tan);
      rect(context, x + 1, 151, 5, 1, COLORS.cream);
      rect(context, x + 2, 164, 4, 2, COLORS.brownDark);
    }

    // Two chunky rails, each with a highlight and a dark underside.
    rect(context, 0, 153, WIDTH, 2, COLORS.rail);
    rect(context, 0, 155, WIDTH, 1, COLORS.black);
    rect(context, 0, 165, WIDTH, 2, COLORS.rail);
    rect(context, 0, 167, WIDTH, 1, COLORS.black);
  }

  drawTrain(context, state) {
    const trainX = 43;
    const carriageY = 119;
    const carriageWidth = 39;
    const carriageGap = 2;
    const carriageCount = 3;

    for (let index = carriageCount - 1; index >= 0; index -= 1) {
      const x = trainX + index * (carriageWidth + carriageGap);
      this.drawCarriage(context, x, carriageY, index);
    }

    const locomotiveX = trainX + carriageCount * (carriageWidth + carriageGap) + 2;
    this.drawLocomotive(context, locomotiveX, 108);
    this.drawSmoke(context, locomotiveX, state.elapsedTime);
  }

  drawCarriage(context, x, y, index) {
    rect(context, x + 3, y - 3, 33, 2, COLORS.rail);
    rect(context, x + 1, y - 1, 37, 2, COLORS.brownDark);
    rect(context, x, y + 1, 39, 22, COLORS.green);
    rect(context, x, y + 9, 39, 4, COLORS.cream);
    rect(context, x, y + 13, 39, 2, COLORS.red);
    rect(context, x, y + 20, 39, 3, COLORS.greenDeep);
    rect(context, x + 4, y + 23, 31, 2, COLORS.black);
    rect(context, x, y + 1, 2, 22, COLORS.greenDeep);
    rect(context, x + 37, y + 1, 2, 22, COLORS.greenDeep);

    for (let windowIndex = 0; windowIndex < 5; windowIndex += 1) {
      const windowX = x + 7 + windowIndex * 6;
      rect(context, windowX, y + 4, 4, 5, COLORS.black);
      rect(context, windowX + 1, y + 5, 2, 3, index === 1 ? '#f3bd70' : '#7499aa');
      pixel(context, windowX + 1, y + 5, COLORS.cream);
    }

    rect(context, x + 2, y + 2, 4, 2, COLORS.greenDeep);
    rect(context, x + 33, y + 2, 4, 2, COLORS.greenDeep);
    rect(context, x + 6, y + 24, 8, 2, COLORS.brownDark);
    rect(context, x + 27, y + 24, 8, 2, COLORS.brownDark);
    this.drawWheel(context, x + 9, 153);
    this.drawWheel(context, x + 30, 153);
  }

  drawLocomotive(context, x, y) {
    // Roof and exhaust stack.
    rect(context, x + 3, y - 4, 35, 2, COLORS.rail);
    rect(context, x + 8, y - 7, 6, 4, COLORS.brownDark);
    rect(context, x + 9, y - 9, 4, 3, COLORS.black);
    rect(context, x + 27, y - 5, 5, 2, COLORS.rail);

    rect(context, x, y, 45, 31, COLORS.trainBlue);
    rect(context, x + 2, y + 1, 42, 2, COLORS.navy);
    rect(context, x, y + 15, 45, 4, COLORS.cream);
    rect(context, x, y + 19, 45, 2, COLORS.red);
    rect(context, x + 2, y + 3, 3, 12, COLORS.navy);
    rect(context, x + 31, y + 4, 10, 10, COLORS.black);
    rect(context, x + 33, y + 6, 6, 6, COLORS.window);
    rect(context, x + 34, y + 6, 4, 1, COLORS.cream);
    rect(context, x + 42, y + 8, 3, 7, COLORS.rail);

    // Front hood and small pixel headlight.
    rect(context, x + 2, y + 21, 41, 7, COLORS.trainBlue);
    rect(context, x + 40, y + 21, 5, 7, COLORS.navy);
    rect(context, x + 43, y + 23, 2, 3, COLORS.warm);
    pixel(context, x + 44, y + 23, COLORS.cream);
    rect(context, x + 10, y + 23, 13, 2, COLORS.navy);
    rect(context, x + 12, y + 25, 9, 2, COLORS.navy);
    rect(context, x + 7, y + 28, 37, 3, COLORS.black);
    rect(context, x + 39, y + 31, 7, 2, COLORS.black);
    rect(context, x + 6, y + 31, 10, 2, COLORS.brownDark);
    rect(context, x + 29, y + 31, 10, 2, COLORS.brownDark);
    this.drawWheel(context, x + 10, 153);
    this.drawWheel(context, x + 34, 153);
  }

  drawWheel(context, x, y) {
    pixelCircle(context, x, y, 5, COLORS.black);
    pixelCircle(context, x, y, 3, COLORS.rail);
    pixel(context, x - 1, y, COLORS.black);
    pixel(context, x + 1, y, COLORS.black);
    pixel(context, x, y - 1, COLORS.black);
    pixel(context, x, y + 1, COLORS.black);
  }

  drawSmoke(context, x, elapsedTime) {
    const puffX = x + 11 + Math.floor(Math.sin(elapsedTime * 2) * 2);
    const puffY = 96 - Math.floor((elapsedTime * 7) % 15);
    pixelCircle(context, puffX, puffY, 3, '#879bab');
    pixelCircle(context, puffX - 5, puffY - 5, 4, '#9ab0b8');
    pixelCircle(context, puffX + 2, puffY - 11, 3, '#afc2c3');
  }

  drawForeground(context, offset) {
    // Near-side grasses partially overlap the embankment, giving the train a
    // stronger sense of motion and placing the track in the landscape.
    repeatAcross(offset * 1.18, 26, (x) => {
      const height = 5 + Math.floor(wrap(x * 3, 8));
      rect(context, x, 149 - height, 2, height, COLORS.greenDeep);
      rect(context, x + 3, 151 - height, 2, height, COLORS.green);
      rect(context, x - 2, 151 - Math.floor(height * 0.6), 2, 2, COLORS.grass);
    });

    for (let x = -8 - wrap(offset * 1.05, 34); x < WIDTH + 34; x += 34) {
      rect(context, x, 174, 19, 2, COLORS.brown);
      rect(context, x + 4, 176, 12, 2, COLORS.brownDark);
    }
  }

  drawPauseBadge(context) {
    rect(context, 8, 8, 83, 18, COLORS.ink);
    rect(context, 9, 9, 81, 16, COLORS.warm);
    rect(context, 12, 12, 2, 10, COLORS.ink);
    rect(context, 17, 12, 2, 10, COLORS.ink);
    this.drawTinyText(context, 'PAUSED', 24, 14, COLORS.ink);
  }

  drawTinyText(context, text, x, y, color) {
    // A tiny seven-segment-like label keeps the pause notice pixel-native.
    const glyphs = {
      P: ['111', '101', '111', '100', '100'],
      A: ['010', '101', '111', '101', '101'],
      U: ['101', '101', '101', '101', '111'],
      S: ['111', '100', '111', '001', '111'],
      E: ['111', '100', '110', '100', '111'],
      D: ['110', '101', '101', '101', '110'],
    };
    [...text].forEach((letter, letterIndex) => {
      const glyph = glyphs[letter];
      if (!glyph) return;
      glyph.forEach((row, rowIndex) => {
        [...row].forEach((bit, columnIndex) => {
          if (bit === '1') rect(context, x + letterIndex * 5 + columnIndex, y + rowIndex, 1, 1, color);
        });
      });
    });
  }
}
