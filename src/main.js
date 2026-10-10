import './style.css';
import { Game } from './engine/Game.js';
import { stations } from './data/stations.js';

const canvas = document.querySelector('#game-canvas');
const stationList = document.querySelector('#station-list');

const ui = {
  stationName: document.querySelector('#station-name'),
  stationRegion: document.querySelector('#station-region'),
  journeyStatus: document.querySelector('#journey-status'),
  progressFill: document.querySelector('#progress-fill'),
  pauseButton: document.querySelector('#pause-button'),
  pauseLabel: document.querySelector('#pause-label'),
  speedButton: document.querySelector('#speed-button'),
  speedLabel: document.querySelector('#speed-label'),
  nextButton: document.querySelector('#next-button'),
};

for (const [index, station] of stations.entries()) {
  const item = document.createElement('li');
  item.className = 'station-list-item';
  item.dataset.stationIndex = String(index);
  item.innerHTML = `
    <span class="station-marker" aria-hidden="true"></span>
    <span class="station-list-copy">
      <strong>${station.name}</strong>
      <small>${station.region} // ${station.code}</small>
    </span>
  `;
  stationList.append(item);
}

const game = new Game(canvas, stations, {
  ...ui,
  stationItems: [...stationList.children],
});

ui.pauseButton.addEventListener('click', () => game.togglePause());
ui.speedButton.addEventListener('click', () => game.toggleSpeed());
ui.nextButton.addEventListener('click', () => game.nextStation());

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement) return;

  if (event.code === 'Space' || event.key.toLowerCase() === 'p') {
    event.preventDefault();
    game.togglePause();
  }
  if (event.key.toLowerCase() === 'n') game.nextStation();
  if (event.key.toLowerCase() === 's') game.toggleSpeed();
});

game.start();
