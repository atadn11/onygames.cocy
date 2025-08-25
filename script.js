const biscuitContainer = document.getElementById('biscuit-container');
const message = document.getElementById('message');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart');

const SHAPES = ['circle', 'triangle', 'star', 'umbrella', 'hexagon', 'pentagon', 'diamond'];

let currentShape = null;
let breakPoints = [];
let brokenPoints = new Set();
let timer = null;
let timeLeft = 20;
let gameOver = false;

function startTimer() {
  timeLeft = 20;
  timerEl.textContent = `زمان: ${timeLeft} ثانیه`;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `زمان: ${timeLeft} ثانیه`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame(false, 'زمان تمام شد! باختی 💥');
    }
  }, 1000);
}

function endGame(win, text) {
  gameOver = true;
  message.textContent = text;
  restartBtn.classList.remove('hidden');
}

function clearGame() {
  biscuitContainer.innerHTML = '';
  message.textContent = '';
  brokenPoints.clear();
  gameOver = false;
  restartBtn.classList.add('hidden');
  biscuitContainer.style.filter = 'none';
  if (timer) {
    clearInterval(timer);
  }
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// برمی‌گرداند بردار نرمال بیرونی به ضلع (بردار عمود به ضلع، جهت بیرون شکل)
function normalVector(p1, p2, center) {
  let vx = p2[0] - p1[0];
  let vy = p2[1] - p1[1];

  let nx = -vy;
  let ny = vx;

  let length = Math.sqrt(nx * nx + ny * ny);
  nx /= length;
  ny /= length;

  let mx = (p1[0] + p2[0]) / 2;
  let my = (p1[1] + p2[1]) / 2;

  let cx = mx - center[0];
  let cy = my - center[1];

  let dot = nx * cx + ny * cy;
  if (dot < 0) {
    nx = -nx;
    ny = -ny;
  }
  return [nx, ny];
}

function createShape(shape) {
  biscuitContainer.innerHTML = '';
  breakPoints = [];
  brokenPoints.clear();

  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute('viewBox', '0 0 320 320');
  svg.classList.add('shape-svg');

  if (shape === 'circle') {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute('cx', 160);
    circle.setAttribute('cy', 160);
    circle.setAttribute('r', 140);
    circle.setAttribute('fill', '#deb887');
    circle.setAttribute('stroke', '#8b4513');
    circle.setAttribute('stroke-width', '6');
    svg.appendChild(circle);

    const centerX = 160;
    const centerY = 160;
    const radius = 140;
    const numPoints = 24;
    for(let i=0; i<numPoints; i++) {
      const angle = (2 * Math.PI / numPoints) * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const p = document.createElementNS(SVG_NS, "circle");
      p.setAttribute('cx', x);
      p.setAttribute('cy', y);
      p.setAttribute('r', 22);
      p.setAttribute('class', 'broken-point');
      p.dataset.index = i;
      svg.appendChild(p);
      breakPoints.push({x, y});
    }

  } else if (shape === 'triangle') {
    const vertices = [[160,20], [280,280], [40,280]];
    const triangle = document.createElementNS(SVG_NS, "polygon");
    triangle.setAttribute('points', vertices.map(p=>p.join(',')).join(' '));
    triangle.setAttribute('fill', '#deb887');
    triangle.setAttribute('stroke', '#8b4513');
    triangle.setAttribute('stroke-width', '6');
    svg.appendChild(triangle);

    const center = [
      vertices.reduce((sum, p) => sum + p[0], 0) / vertices.length,
      vertices.reduce((sum, p) => sum + p[1], 0) / vertices.length
    ];

    for(let i=0; i<vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i+1) % vertices.length];

      const midX = (p1[0] + p2[0]) / 2;
      const midY = (p1[1] + p2[1]) / 2;

      // نقطه وسط ضلع
      let idx = breakPoints.length;
      const point1 = document.createElementNS(SVG_NS, "circle");
      point1.setAttribute('cx', midX);
      point1.setAttribute('cy', midY);
      point1.setAttribute('r', 20);
      point1.setAttribute('class', 'broken-point');
      point1.dataset.index = idx;
      svg.appendChild(point1);
      breakPoints.push({x: midX, y: midY});

      // بردار نرمال بیرونی
      let [nx, ny] = normalVector(p1, p2, center);
      const shiftDist = 20;
      const shiftedX = midX + nx * shiftDist;
      const shiftedY = midY + ny * shiftDist;

      // نقطه دوم شیفت داده شده بیرون ضلع
      idx = breakPoints.length;
      const point2 = document.createElementNS(SVG_NS, "circle");
      point2.setAttribute('cx', shiftedX);
      point2.setAttribute('cy', shiftedY);
      point2.setAttribute('r', 20);
      point2.setAttribute('class', 'broken-point');
      point2.dataset.index = idx;
      svg.appendChild(point2);
      breakPoints.push({x: shiftedX, y: shiftedY});
    }

  } else if (shape === 'star') {
    const starPoints = "160,20 197,120 300,120 215,180 250,280 160,220 70,280 105,180 20,120 123,120";
    const vertices = starPoints.split(' ').map(p => p.split(',').map(Number));

    const star = document.createElementNS(SVG_NS, "polygon");
    star.setAttribute('points', starPoints);
    star.setAttribute('fill', '#deb887');
    star.setAttribute('stroke', '#8b4513');
    star.setAttribute('stroke-width', '6');
    svg.appendChild(star);

    const center = [
      vertices.reduce((sum,p) => sum + p[0],0) / vertices.length,
      vertices.reduce((sum,p) => sum + p[1],0) / vertices.length,
    ];

    for(let i=0; i<vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i+1) % vertices.length];

      const midX = (p1[0] + p2[0]) / 2;
      const midY = (p1[1] + p2[1]) / 2;

      let idx = breakPoints.length;
      const point1 = document.createElementNS(SVG_NS, "circle");
      point1.setAttribute('cx', midX);
      point1.setAttribute('cy', midY);
      point1.setAttribute('r', 18);
      point1.setAttribute('class', 'broken-point');
      point1.dataset.index = idx;
      svg.appendChild(point1);
      breakPoints.push({x: midX, y: midY});

      let [nx, ny] = normalVector(p1, p2, center);
      const shiftDist = 18;
      const shiftedX = midX + nx * shiftDist;
      const shiftedY = midY + ny * shiftDist;

      idx = breakPoints.length;
      const point2 = document.createElementNS(SVG_NS, "circle");
      point2.setAttribute('cx', shiftedX);
      point2.setAttribute('cy', shiftedY);
      point2.setAttribute('r', 18);
      point2.setAttribute('class', 'broken-point');
      point2.dataset.index = idx;
      svg.appendChild(point2);
      breakPoints.push({x: shiftedX, y: shiftedY});
    }

  } else if (shape === 'umbrella') {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute('d', 'M30 180 A130 130 0 0 1 290 180 L290 200 L30 200 Z');
    path.setAttribute('fill', '#deb887');
    path.setAttribute('stroke', '#8b4513');
    path.setAttribute('stroke-width', '6');
    svg.appendChild(path);

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute('x', 150);
    rect.setAttribute('y', 180);
    rect.setAttribute('width', 10);
    rect.setAttribute('height', 80);
    rect.setAttribute('fill', '#8b4513');
    svg.appendChild(rect);

    const basePoints = [
      [160, 50],
      [80, 120],
      [240, 120],
      [160, 180],
      [160, 220],
      [160, 250],
      [160, 270],
    ];

    const center = [
      basePoints.reduce((s,p) => s+p[0], 0) / basePoints.length,
      basePoints.reduce((s,p) => s+p[1], 0) / basePoints.length
    ];

    for(let i=0; i<basePoints.length; i++) {
      const p1 = basePoints[i];
      const p2 = basePoints[(i+1)%basePoints.length];

      const midX = (p1[0]+p2[0])/2;
      const midY = (p1[1]+p2[1])/2;

      let idx = breakPoints.length;
      const point1 = document.createElementNS(SVG_NS,"circle");
      point1.setAttribute('cx', midX);
      point1.setAttribute('cy', midY);
      point1.setAttribute('r', 16);
      point1.setAttribute('class', 'broken-point');
      point1.dataset.index = idx;
      svg.appendChild(point1);
      breakPoints.push({x: midX, y: midY});

      let [nx, ny] = normalVector(p1, p2, center);
      const shiftDist = 14;
      const shiftedX = midX + nx * shiftDist;
      const shiftedY = midY + ny * shiftDist;

      idx = breakPoints.length;
      const point2 = document.createElementNS(SVG_NS,"circle");
      point2.setAttribute('cx', shiftedX);
      point2.setAttribute('cy', shiftedY);
      point2.setAttribute('r', 16);
      point2.setAttribute('class', 'broken-point');
      point2.dataset.index = idx;
      svg.appendChild(point2);
      breakPoints.push({x: shiftedX, y: shiftedY});
    }

  } else if (shape === 'hexagon') {
    const cx = 160, cy = 160, r = 140;
    const vertices = [];
    for(let i=0; i<6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      vertices.push([x, y]);
    }

    const hexagon = document.createElementNS(SVG_NS, "polygon");
    hexagon.setAttribute('points', vertices.map(p=>p.join(',')).join(' '));
    hexagon.setAttribute('fill', '#deb887');
    hexagon.setAttribute('stroke', '#8b4513');
    hexagon.setAttribute('stroke-width', '6');
    svg.appendChild(hexagon);

    const center = [
      vertices.reduce((s,p) => s+p[0], 0) / vertices.length,
      vertices.reduce((s,p) => s+p[1], 0) / vertices.length,
    ];

    for(let i=0; i<vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i+1) % vertices.length];

      const midX = (p1[0] + p2[0]) / 2;
      const midY = (p1[1] + p2[1]) / 2;

      let idx = breakPoints.length;
      const point1 = document.createElementNS(SVG_NS,"circle");
      point1.setAttribute('cx', midX);
      point1.setAttribute('cy', midY);
      point1.setAttribute('r', 18);
      point1.setAttribute('class', 'broken-point');
      point1.dataset.index = idx;
      svg.appendChild(point1);
      breakPoints.push({x: midX, y: midY});

      let [nx, ny] = normalVector(p1, p2, center);
      const shiftDist = 16;
      const shiftedX = midX + nx * shiftDist;
      const shiftedY = midY + ny * shiftDist;

      idx = breakPoints.length;
      const point2 = document.createElementNS(SVG_NS,"circle");
      point2.setAttribute('cx', shiftedX);
      point2.setAttribute('cy', shiftedY);
      point2.setAttribute('r', 18);
      point2.setAttribute('class', 'broken-point');
      point2.dataset.index = idx;
      svg.appendChild(point2);
      breakPoints.push({x: shiftedX, y: shiftedY});
    }

  } else if (shape === 'pentagon') {
    const cx = 160, cy = 160, r = 140;
    const vertices = [];
    for(let i=0; i<5; i++) {
      const angle = (2 * Math.PI / 5) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      vertices.push([x, y]);
    }

    const pentagon = document.createElementNS(SVG_NS, "polygon");
    pentagon.setAttribute('points', vertices.map(p=>p.join(',')).join(' '));
    pentagon.setAttribute('fill', '#deb887');
    pentagon.setAttribute('stroke', '#8b4513');
    pentagon.setAttribute('stroke-width', '6');
    svg.appendChild(pentagon);

    const center = [
      vertices.reduce((s,p) => s+p[0], 0) / vertices.length,
      vertices.reducevertices.reduce((s,p) => s+p[1], 0) / vertices.length,
    ];

    for(let i=0; i<vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i+1) % vertices.length];

      const midX = (p1[0] + p2[0]) / 2;
      const midY = (p1[1] + p2[1]) / 2;

      let idx = breakPoints.length;
      const point1 = document.createElementNS(SVG_NS,"circle");
      point1.setAttribute('cx', midX);
      point1.setAttribute('cy', midY);
      point1.setAttribute('r', 18);
      point1.setAttribute('class', 'broken-point');
      point1.dataset.index = idx;
      svg.appendChild(point1);
      breakPoints.push({x: midX, y: midY});

      let [nx, ny] = normalVector(p1, p2, center);
      const shiftDist = 16;
      const shiftedX = midX + nx * shiftDist;
      const shiftedY = midY + ny * shiftDist;

      idx = breakPoints.length;
      const point2 = document.createElementNS(SVG_NS,"circle");
      point2.setAttribute('cx', shiftedX);
      point2.setAttribute('cy', shiftedY);
      point2.setAttribute('r', 18);
      point2.setAttribute('class', 'broken-point');
      point2.dataset.index = idx;
      svg.appendChild(point2);
      breakPoints.push({x: shiftedX, y: shiftedY});
    }

  } else if (shape === 'diamond') {
    const vertices = [[160,20], [280,160], [160,300], [40,160]];
    const diamond = document.createElementNS(SVG_NS, "polygon");
    diamond.setAttribute('points', vertices.map(p=>p.join(',')).join(' '));
    diamond.setAttribute('fill', '#deb887');
    diamond.setAttribute('stroke', '#8b4513');
    diamond.setAttribute('stroke-width', '6');
    svg.appendChild(diamond);

    const center = [
      vertices.reduce((s,p) => s+p[0], 0) / vertices.length,
      vertices.reduce((s,p) => s+p[1], 0) / vertices.length,
    ];

    for(let i=0; i<vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i+1) % vertices.length];

      const midX = (p1[0] + p2[0]) / 2;
      const midY = (p1[1] + p2[1]) / 2;

      let idx = breakPoints.length;
      const point1 = document.createElementNS(SVG_NS,"circle");
      point1.setAttribute('cx', midX);
      point1.setAttribute('cy', midY);
      point1.setAttribute('r', 18);
      point1.setAttribute('class', 'broken-point');
      point1.dataset.index = idx;
      svg.appendChild(point1);
      breakPoints.push({x: midX, y: midY});

      let [nx, ny] = normalVector(p1, p2, center);
      const shiftDist = 16;
      const shiftedX = midX + nx * shiftDist;
      const shiftedY = midY + ny * shiftDist;

      idx = breakPoints.length;
      const point2 = document.createElementNS(SVG_NS,"circle");
      point2.setAttribute('cx', shiftedX);
      point2.setAttribute('cy', shiftedY);
      point2.setAttribute('r', 18);
      point2.setAttribute('class', 'broken-point');
      point2.dataset.index = idx;
      svg.appendChild(point2);
      breakPoints.push({x: shiftedX, y: shiftedY});
    }
  }

  biscuitContainer.appendChild(svg);
  currentShape = shape;
}

function checkClickNearPoint(x, y) {
  for (let i = 0; i < breakPoints.length; i++) {
    if (brokenPoints.has(i)) continue;
    let p = breakPoints[i];
    if (distance(x, y, p.x, p.y) <= 25) {
      return i;
    }
  }
  return -1;
}

function onBiscuitClick(e) {
  if (gameOver) return;

  const svg = biscuitContainer.querySelector('svg');
  const rect = svg.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  let idx = checkClickNearPoint(clickX, clickY);
  if (idx !== -1) {
    brokenPoints.add(idx);
    showBrokenPoint(idx);
    message.textContent = `قسمتی از بیسکوییت شکسته شد! (${brokenPoints.size}/${breakPoints.length})`;

    if (brokenPoints.size === breakPoints.length) {
      clearInterval(timer);
      endGame(true, 'تبریک! بیسکوییت کامل شکسته شد 🎉');
    }
  } else {
    message.textContent = 'اشتباه زدی، ولی مشکلی نیست! ادامه بده...';
  }
}

function showBrokenPoint(index) {
  const points = biscuitContainer.querySelectorAll('.broken-point');
  if (points[index]) {
    points[index].classList.add('broken');
  }
}

function restartGame() {
  clearGame();
  let randomIndex = Math.floor(Math.random() * SHAPES.length);
  createShape(SHAPES[randomIndex]);
  startTimer();
}

restartBtn.addEventListener('click', () => {
  restartGame();
});

biscuitContainer.addEventListener('click', onBiscuitClick);

restartGame();