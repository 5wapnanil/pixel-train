import { Renderer } from './Renderer.js';

/**
 * Owns the simulation state and the requestAnimationFrame loop.
 * The renderer only draws the state it receives, which keeps the two jobs
 * separate and makes the game easier to expand later.
 */
export class Game {
  constructor(canvas, stations, ui) {
    this.stations = stations;
    this.ui = ui;
    this.renderer = new Renderer(canvas);
    this.lastTime = 0;
    this.animationFrame = 0;

    this.state = {
      paused: false,
      speedMultiplier: 1,
      stationIndex: 0,
      stationTime: 0,
      worldOffset: 0,
      elapsedTime: 0,
    };

    this.frame = this.frame.bind(this);
  }

  start() {
    this.updateInterface();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  frame(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;

    // Clamp a long inactive-tab pause so the train does not jump across the
    // whole route when the browser gives us a very large delta time.
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (!this.state.paused) this.update(deltaTime);
    this.renderer.render(this.state);
    this.updateInterface();

    this.animationFrame = requestAnimationFrame(this.frame);
  }

  update(deltaTime) {
    const speed = this.state.speedMultiplier;
    const currentStation = this.stations[this.state.stationIndex];

    this.state.elapsedTime += deltaTime * speed;
    this.state.stationTime += deltaTime * speed;
    this.state.worldOffset += deltaTime * 21 * speed;

    if (this.state.stationTime >= currentStation.travelSeconds) {
      this.state.stationTime = 0;
      this.state.stationIndex =
        (this.state.stationIndex + 1) % this.stations.length;
    }
  }

  togglePause() {
    this.state.paused = !this.state.paused;
    this.updateInterface();
  }

  toggleSpeed() {
    this.state.speedMultiplier = this.state.speedMultiplier === 1 ? 2 : 1;
    this.updateInterface();
  }

  nextStation() {
    this.state.stationIndex =
      (this.state.stationIndex + 1) % this.stations.length;
    this.state.stationTime = 0;
    // Move the landscape forward so a manual skip has a visible response.
    this.state.worldOffset += 150;
    this.updateInterface();
  }

  updateInterface() {
    const currentStation = this.stations[this.state.stationIndex];
    const progress = this.state.stationTime / currentStation.travelSeconds;

    this.ui.stationName.textContent = currentStation.name;
    this.ui.stationRegion.textContent = `${currentStation.region} // ${currentStation.code}`;
    this.ui.progressFill.style.width = `${Math.min(progress * 100, 100)}%`;
    this.ui.journeyStatus.textContent = this.state.paused
      ? 'JOURNEY PAUSED'
      : 'EN ROUTE';

    this.ui.pauseLabel.textContent = this.state.paused
      ? 'RESUME JOURNEY'
      : 'PAUSE JOURNEY';
    this.ui.pauseButton.classList.toggle('is-active', this.state.paused);

    this.ui.speedLabel.textContent = `TRAVEL SPEED ${this.state.speedMultiplier}×`;
    this.ui.speedButton.classList.toggle(
      'is-active',
      this.state.speedMultiplier === 2,
    );

    for (const [index, item] of this.ui.stationItems.entries()) {
      item.classList.toggle('is-current', index === this.state.stationIndex);
    }
  }
}
