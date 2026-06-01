const canvas = document.getElementById('fittsCanvas');
const ctx = canvas.getContext('2d');
const distanceInput = document.getElementById('distanceInput');
const widthInput = document.getElementById('widthInput');
const circlesInput = document.getElementById('circlesInput');
const startButton = document.getElementById('startButton');
const setButton = document.getElementById('setButton');
const downloadButton = document.getElementById('downloadButton');
const statusText = document.getElementById('statusText');
const infoText = document.getElementById('infoText');
const logArea = document.getElementById('logArea');

const canvasWidth = 1200;
const canvasHeight = 800;

let d = parseInt(distanceInput.value, 10);
let w = parseInt(widthInput.value, 10);
let numOfTargets = parseInt(circlesInput.value, 10);
let running = false;
let t0 = 0;
let missCount = 0;
let pMouseX = 0;
let pMouseY = 0;
let activeOrder = 0;
let targets = [];
let targetOrders = [];
let dataLines = [];

function log(message) {
  const now = new Date().toLocaleTimeString();
  logArea.value += `[${now}] ${message}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function setTarget() {
  targets = [];
  targetOrders = [];
  let centerX, centerY;
  let order = 0;

  const radius = d / 2;
  const center = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
  };

  targets.push({ x: center.x + radius * Math.cos(2 * Math.PI - Math.PI / 2), y: center.y + radius * Math.sin(2 * Math.PI - Math.PI / 2) });
  targetOrders.push(0);

  const half = Math.floor(numOfTargets / 2);
  for (let i = 1; i <= numOfTargets; i++) {
    if (numOfTargets % 2 === 0) {
      if (i % 2 === 0) {
        order = order + half - 1;
      } else {
        order = order + half;
      }
      if (order >= numOfTargets) {
        order -= numOfTargets;
      }
    } else {
      order = (order + half) % numOfTargets;
    }

    centerX = center.x + radius * Math.cos(2 * Math.PI * (i / numOfTargets) - Math.PI / 2);
    centerY = center.y + radius * Math.sin(2 * Math.PI * (i / numOfTargets) - Math.PI / 2);
    targets.push({ x: centerX, y: centerY });
    targetOrders.push(order);
  }

  if (numOfTargets % 2 === 0) {
    targetOrders.push(0);
  }
}

function updateInfoText() {
  infoText.textContent = `d=${d}  w=${w}  circles=${numOfTargets}  orderLength=${targetOrders.length}`;
}

function setFileName() {
  return `d${d}w${w}.csv`;
}

function writeData(line) {
  dataLines.push(line);
}

function startExp() {
  dataLines = [];
  writeData(`try,time,mouseMoveDistance,miss,${new Date().getHours()},${new Date().getMinutes()},${new Date().getSeconds()}`);
  running = true;
  t0 = performance.now();
  missCount = 0;
  activeOrder = 0;
  statusText.textContent = `Running (${setFileName()})`;
  log('Experiment started');
}

function stopExp() {
  running = false;
  statusText.textContent = `Stopped. miss: ${missCount}`;
  log(`Experiment finished. missCount=${missCount}`);
}

function isPointInTarget(target, x, y) {
  const dx = target.x - x;
  const dy = target.y - y;
  return Math.sqrt(dx * dx + dy * dy) < w / 2;
}

function handleCanvasClick(event) {
  if (!running) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (activeOrder > 0) {
    const t = performance.now() - t0;
    const moveDist = Math.round(Math.hypot(pMouseX - mouseX, pMouseY - mouseY) * 100) / 100;
    const targetIndex = targetOrders[activeOrder];
    const hit = isPointInTarget(targets[targetIndex], mouseX, mouseY);

    if (hit) {
      const prevIndex = targetOrders[activeOrder - 1];
      log(`${prevIndex} -> ${targetIndex} time: ${Math.round(t)} ms`);
      writeData(`${activeOrder},${Math.round(t)},${moveDist},0`);
    } else {
      missCount += 1;
      log('NG');
      writeData(`${activeOrder},${Math.round(t)},${moveDist},1`);
    }
  }

  pMouseX = mouseX;
  pMouseY = mouseY;
  activeOrder += 1;

  const stopWhen = numOfTargets % 2 === 1 ? numOfTargets : numOfTargets + 1;
  if (activeOrder > stopWhen) {
    stopExp();
  }

  t0 = performance.now();
}

function drawScene() {
  ctx.fillStyle = 'rgba(150,150,150,0.5)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    ctx.beginPath();
    ctx.arc(target.x, target.y, w / 2, 0, Math.PI * 2);
    if (running) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.fillStyle = 'transparent';
    }
    ctx.stroke();
  }

  if (running && targetOrders[activeOrder] !== undefined) {
    const current = targets[targetOrders[activeOrder]];
    ctx.beginPath();
    ctx.arc(current.x, current.y, w / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,0,0.8)';
    ctx.fill();
    ctx.strokeStyle = '#00ff00';
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
  }

  requestAnimationFrame(drawScene);
}

function downloadCsv() {
  const csvContent = dataLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = setFileName();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function applySettings() {
  d = clampNumber(distanceInput.value, 10, 1000);
  w = clampNumber(widthInput.value, 4, 300);
  numOfTargets = clampNumber(circlesInput.value, 3, 50);
  distanceInput.value = d;
  widthInput.value = w;
  circlesInput.value = numOfTargets;
  setTarget();
  updateInfoText();
  statusText.textContent = 'Settings updated';
  log(`Settings: d=${d}, w=${w}, circles=${numOfTargets}`);
}

canvas.addEventListener('mousedown', handleCanvasClick);
startButton.addEventListener('click', startExp);
setButton.addEventListener('click', applySettings);
downloadButton.addEventListener('click', downloadCsv);

setTarget();
updateInfoText();
log('Ready');
requestAnimationFrame(drawScene);
