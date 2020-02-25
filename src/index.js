import { TweenMax, Power1 } from 'gsap';
import { Circle } from './Circle';

// inspiration https://codepen.io/filipemcribeiro/pen/Wwvrbj



const SIBLINGS = 3;


let content;
let bubble;
let width;
let height;
let wrapper;
let canvas;
let ctx;
let points;
let tweens = new Map();


initScene();
initAnimation();
addListeners();


function initScene() {
  wrapper = document.getElementById('wrapper');
  canvas = document.getElementById('canvas');
  content = [...document.querySelectorAll('#content-for-dots article')];
  bubble = document.querySelector('.bubbleWithContent');


  width = wrapper.clientWidth;
  height = wrapper.clientHeight;

  canvas.width = width;
  canvas.height = height;

  ctx = canvas.getContext('2d');

  // create points
  points = [];

  for(let x = 0; x < width; x = x + width/5) {
    for(let y = 0; y < height; y = y + height/5) {
      let px = x + Math.random()*width/5;
      let py = y + Math.random()*height/5;
      let p = {
        x: px,
        y: py,
        originX: px,
        originY: py
      };
      points.push(p);
    }
  }


  // for each point find the ${SIBLINGS} closest points
  for(let i = 0; i < points.length; i++) {
    let closest = [];
    let p1 = points[i];
    for(let j = 0; j < points.length; j++) {
      let p2 = points[j]
      if(!(p1 == p2)) {
        let placed = false;
        for(let k = 0; k < SIBLINGS; k++) {
          if(!placed) {
            if(closest[k] == undefined) {
              closest[k] = p2;
              placed = true;
            }
          }
        }

        for(let k = 0; k < SIBLINGS; k++) {
          if(!placed) {
            if(getDistance(p1, p2) < getDistance(p1, closest[k])) {
              closest[k] = p2;
              placed = true;
            }
          }
        }
      }
    }
    p1.closest = closest;
  }


  // assign a circle to each point
  for(let i in points) {
    let options = {
      ctx,
      position: points[i],
      radius: 4+Math.random()*3,
    };

    let c = new Circle(options);

    points[i].circle = c;
    points[i].active = 0.1;
    points[i].circle.active = 0.3;
  }


  // assign a content and tooltip to starting points
  // @todo create points with content in certain places by business requirements
  content.forEach((item, idx) => {
    let tooltip = item.getAttribute('data-tooltip');
    points[idx + idx].tooltip = tooltip;
    points[idx + idx].content = item;
  });


  // create tooltips
  for(let i in points) {
    let p = points[i];
    p.tooltip && createTooltip(p);
  }
}

function addListeners() {
  window.addEventListener('mousemove', mouseMove); //@todo add throttle
  window.addEventListener('resize', resize); //@todo add debounce
}

function mouseMove(e) {
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  checkHover(mouseX, mouseY);
}

function resize() {
  //@todo restart amimation
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}

function createTooltip(p) {
  let domTooltip = document.createElement('div');
  domTooltip.classList.add('tooltipWithContent');
  domTooltip.setAttribute('aria-hidden', true);
  domTooltip.innerHTML = p.tooltip;
  wrapper.appendChild(domTooltip);
  p.tooltip = domTooltip;
}


// @todo decompose by best practice:
// update();
// draw();
function initAnimation() {
  animate();
  for(let i in points) {
    movePoint(points[i]);
  }
}


function animate(timestamp) {
  ctx.clearRect(0,0,width,height);

  for(let i in points) {
    let p = points[i];

    if (p.tooltip) {
      p.circle.radius = 7;
      p.circle.active = .5;
    }

    drawLines(p);
    p.circle.draw();
    updateTooltips(p);
  }

  requestAnimationFrame(animate);
}

function movePoint(p) {
  // @todo try replace to anime.js
  let tween = TweenMax.to(p, 20+1*Math.random(), {
    x: p.originX-50+Math.random()*300,
    y: p.originY-50+Math.random()*300,
    ease: Power1.easeInOut,
    yoyo: true,
    repeat: -1
  });

  tweens.set(p, tween);
}


function drawLines(p) {
  if(!p.active) return null;

  for(let i in p.closest) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.closest[i].x, p.closest[i].y);
    ctx.strokeStyle = `rgba(255,255,255, ${p.active}`;
    ctx.stroke();
  }
}

function updateTooltips(p) {
  if (!p.tooltip) return null;

  p.tooltip.style.transform = `translate(${p.circle.pos.x}px, ${p.circle.pos.y}px)`;
}


function getDistance(p1, p2) {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}


function checkHover(mouseX, mouseY) {
  for(let i = 0; i < points.length; i++) {
    let p = points[i];

    if (!p.tooltip) continue;

    let { width, height } = p.tooltip.getBoundingClientRect();

    let leftBorder = p.circle.pos.x - p.circle.radius;
    let rightBorder = p.circle.pos.x + p.circle.radius + width;
    let topBorder = p.circle.pos.y - p.circle.radius;
    let bottomBorder = p.circle.pos.y + p.circle.radius + height;

    if((mouseX > leftBorder) && (mouseX < rightBorder) && (mouseY > topBorder) && (mouseY < bottomBorder)) {
      p.isPause || tweens.get(p).pause();
      p.isPause = true;
      showBubble(p);
      break;
    } else {
      p.isPause && tweens.get(p).resume();
      p.isPause = false;
    }
  }
}

function showBubble(p) {
  console.log(p.content);
  bubble.innerHTML = p.content;
  bubble.style.left = `${p.circle.pos.x}px`;
  bubble.style.top = `${p.circle.pos.y}px`;
}
