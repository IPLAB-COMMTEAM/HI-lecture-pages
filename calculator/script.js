const labels = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "+"],
  ["0", "C", "=", "-"]
];

const buttonGrid = document.getElementById("buttonGrid");
const calcKeys = document.getElementById("calcKeys");
const resultInput = document.getElementById("resultInput");
const taskText = document.getElementById("taskText");
const inputText = document.getElementById("inputText");
const buttonInfo = document.getElementById("buttonInfo");
const logsElement = document.getElementById("logs");
const sizeSlider = document.getElementById("sizeSlider");
const distanceSlider = document.getElementById("distanceSlider");
const sizeValue = document.getElementById("sizeValue");
const distanceValue = document.getElementById("distanceValue");
const startButton = document.getElementById("startButton");
const downloadButton = document.getElementById("downloadButton");
const timeCounter = document.getElementById("timeCounter");

let op1 = 0;
let wasDigit = true;
let lastOpr = "+";
let count = 0;
let numTerms = 2;
let logs = [];
let typedHistory = "";
let expression = "";
let currentOperand = "";
let finish = false;
let sessionStarted = false;
let logsReady = false;
let startTimestamp = null;
let lastTime = 0;
let lastX = 0;
let lastY = 0;
let buttonTimerStart = null;
let buttonTimerInterval = null;

function formatButtonGrid() {
  const size = Number(sizeSlider.value);
  const distance = Number(distanceSlider.value);
  calcKeys.style.gridTemplateColumns = `repeat(4, ${size}px)`;
  calcKeys.style.gridAutoRows = `${size}px`;
  calcKeys.style.gap = `${Math.max(0, distance - size)}px`;

  const buttons = calcKeys.querySelectorAll(".calc-button");
  buttons.forEach(button => {
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
  });
}

function updateSliderLabels() {
  sizeValue.textContent = sizeSlider.value;
  distanceValue.textContent = distanceSlider.value;
  if (Number(sizeSlider.value) > Number(distanceSlider.value)) {
    distanceSlider.value = sizeSlider.value;
    distanceValue.textContent = distanceSlider.value;
  }
}

function writeButtonInfo() {
  const size = Number(sizeSlider.value);
  const distance = Number(distanceSlider.value);
  const info = [
    `buttonsize,${size}`,
    `buttondistance,${distance}`,
    `START,240,120`
  ];
  labels.flat().forEach((label, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const x = col * distance + 10 + Math.trunc(size / 2);
    const y = row * distance + 150 + Math.trunc(size / 2);
    info.push(`${label},${x},${y}`);
  });
  buttonInfo.textContent = info.join("\n");
}

function writeLog(entry, start = false) {
  if (start) {
    logs = [entry];
  } else {
    logs.push(entry);
  }
  logsElement.textContent = logs.join("\n");
}

function setButtonEnabled(button, enabled) {
  button.disabled = !enabled;
  button.classList.toggle("disabled", !enabled);
}

function updateDownloadButtonState() {
  setButtonEnabled(downloadButton, logsReady);
}

function updateStartButtonState() {
  const enabled = !(sessionStarted && !finish);
  setButtonEnabled(startButton, enabled);
}

function updateTimeCounter() {
  if (buttonTimerStart === null) {
    timeCounter.textContent = "0 ms";
    return;
  }
  timeCounter.textContent = `${Math.floor(Date.now() - buttonTimerStart)} ms`;
}

function startButtonTimer() {
  buttonTimerStart = Date.now();
  updateTimeCounter();
  if (buttonTimerInterval === null) {
    buttonTimerInterval = setInterval(updateTimeCounter, 100);
  }
}

function stopButtonTimer() {
  if (buttonTimerInterval !== null) {
    clearInterval(buttonTimerInterval);
    buttonTimerInterval = null;
  }
}

function resetButtonTimer() {
  buttonTimerStart = null;
  stopButtonTimer();
  updateTimeCounter();
}

function downloadCSV() {
  const csvLines = [
    "button info",
    ...buttonInfo.textContent.split("\n"),
    "",
    "log",
    ...logs
  ];
  const csvContent = csvLines.map(line => line.replace(/\r?\n/g, "")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const pad = (value) => String(value).padStart(2, "0");
  const timestamp = startTimestamp || new Date();
  const year = timestamp.getFullYear();
  const month = pad(timestamp.getMonth() + 1);
  const day = pad(timestamp.getDate());
  const hour = pad(timestamp.getHours());
  const minute = pad(timestamp.getMinutes());
  const second = pad(timestamp.getSeconds());
  const size = Number(sizeSlider.value);
  const distance = Number(distanceSlider.value);
  link.download = `calc_w${size}d${distance}_${year}${month}${day}_${hour}${minute}${second}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function newTask(nums) {
  let term = String(10 + Math.floor(Math.random() * 90));
  for (let i = 0; i < nums - 1; i += 1) {
    const op = ["+", "-", "*", "/"][Math.floor(Math.random() * 4)];
    term += op + String(10 + Math.floor(Math.random() * 90));
  }
  return term;
}

function applyOperator(op, a, b) {
  const x = Number(a);
  const y = Number(b);
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return y === 0 ? 0 : Math.trunc(x / y);
    case "=": return y;
    default: return y;
  }
}

function resetCalculator() {
  op1 = 0;
  wasDigit = false;
  lastOpr = "+";
  count = 0;
  typedHistory = "";
  expression = "";
  currentOperand = "";
  resultInput.value = "0";
  inputText.textContent = "";
  taskText.textContent = "......";
  finish = false;
  logs = [];
  logsElement.textContent = "";
  sessionStarted = false;
  logsReady = false;
  lastTime = 0;
  lastX = 0;
  lastY = 0;
  resetButtonTimer();
  updateDownloadButtonState();
  updateStartButtonState();
}

function handleButton(label) {
  if (finish && sessionStarted) {
    return;
  }

  if (label >= "0" && label <= "9") {
    if (wasDigit) {
      currentOperand += label;
    } else {
      currentOperand = label;
    }
    expression += label;
    resultInput.value = expression;
    wasDigit = true;
  } else if (label === "C") {
    resetCalculator();
  } else if (label === "=") {
    if (currentOperand !== "") {
      op1 = applyOperator(lastOpr, op1, Number(currentOperand));
    }
    resultInput.value = String(op1);
    expression = "";
    currentOperand = "";
    lastOpr = "=";

    if (sessionStarted) {
      count += 1;
      typedHistory = "";
      inputText.textContent = typedHistory;
      if (count >= 8) {
        taskText.textContent = "FINISH!!";
        finish = true;
        sessionStarted = false;
        logsReady = true;
        stopButtonTimer();
      } else {
        taskText.textContent = newTask(numTerms);
      }
      updateDownloadButtonState();
      updateStartButtonState();
    }
  } else {
    if (currentOperand !== "") {
      op1 = applyOperator(lastOpr, op1, Number(currentOperand));
    }
    expression += label;
    resultInput.value = expression;
    currentOperand = "";
    lastOpr = label;
    wasDigit = false;
  }

  if (sessionStarted && label !== "C") {
    if (label === "=") {
      typedHistory = "";
      inputText.textContent = typedHistory;
    } else {
      typedHistory += label;
      inputText.textContent = typedHistory;
    }
  }
}

function createButtons() {
  calcKeys.innerHTML = "";
  labels.forEach(row => {
    row.forEach(label => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calc-button";
      button.textContent = label;
      button.addEventListener("click", (event) => {
        if (sessionStarted) {
          const currentTime = performance.now();
          const delta = lastTime ? Math.round(currentTime - lastTime) : 0;
          const dist = (lastTime || lastX || lastY)
            ? Math.round(Math.hypot(event.clientX - lastX, event.clientY - lastY))
            : 0;
          writeLog(`${label},${delta},${dist}`);
          lastTime = currentTime;
          lastX = event.clientX;
          lastY = event.clientY;
        }
        handleButton(label);
        if (sessionStarted && !finish) {
          startButtonTimer();
        }
      });
      calcKeys.appendChild(button);
    });
  });
  formatButtonGrid();
}

function setupCollapseToggles() {
  const toggles = document.querySelectorAll(".collapse-toggle");
  toggles.forEach(toggle => {
    const targetId = toggle.dataset.target;
    const target = document.getElementById(targetId);
    if (!target) return;
    toggle.addEventListener("click", () => {
      const isExpanded = target.classList.toggle("expanded");
      toggle.classList.toggle("expanded", isExpanded);
    });
  });
}

sizeSlider.addEventListener("input", () => {
  updateSliderLabels();
  formatButtonGrid();
});

distanceSlider.addEventListener("input", () => {
  updateSliderLabels();
  formatButtonGrid();
});

startButton.addEventListener("click", () => {
  sessionStarted = true;
  logsReady = false;
  startTimestamp = new Date();
  writeLog("button,time,distance", true);
  writeLog("START,0,0");
  writeButtonInfo();
  taskText.textContent = newTask(numTerms);
  count = 0;
  finish = false;
  op1 = 0;
  lastOpr = "+";
  wasDigit = false;
  resultInput.value = "0";
  typedHistory = "";
  expression = "";
  currentOperand = "";
  inputText.textContent = "";
  lastTime = performance.now();
  lastX = 0;
  lastY = 0;
  resetButtonTimer();
  startButtonTimer();
  updateDownloadButtonState();
  updateStartButtonState();
});

downloadButton.addEventListener("click", downloadCSV);

window.addEventListener("load", () => {
  updateSliderLabels();
  resetCalculator();
  createButtons();
  setupCollapseToggles();
});
