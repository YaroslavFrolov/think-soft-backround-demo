import { TweenLite, Power1 } from 'gsap';
import { Circle } from './Circle';

// inspiration https://codepen.io/filipemcribeiro/pen/Wwvrbj


const SIBLINGS = 3;

let content;
let popup;
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
  popup = document.querySelector('.popupWithContent');


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
  // @todo create points with content in certain places according to business requirements
  // @todo get coordinates for dots from data-attributes
  content.forEach((item, idx, arr) => {
    let tooltip = item.getAttribute('data-tooltip');
    points[idx].tooltip = tooltip;
    points[idx].content = item;
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
  let { left, top } = wrapper.getBoundingClientRect();

  let mouseX = e.clientX - left;
  let mouseY = e.clientY - top;

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
  // @todo replace TweenLite to anime.js
  let tween = TweenLite.to(p, 20+1*Math.random(), {
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

    if (p.isPause) {
      let { width, height } = popup.getBoundingClientRect();
      let isAbovePopup = isHoverArea(p, { width, height, mouseX, mouseY });

      if(!isAbovePopup) {
        tweens.get(p).resume();
        p.isPause = false;
        removePopup();
      }

      break;
    }

    let { width, height } = p.tooltip.getBoundingClientRect();
    let isAboveTooltip = isHoverArea(p, { width, height, mouseX, mouseY });

    if(isAboveTooltip) {
      tweens.get(p).pause();
      showPopup(p);
      p.isPause = true;
      break;
    }
  }
}

function showPopup(p) {
  // @todo - detect collision with screen borders and shift position
  popup.appendChild(p.content);
  popup.style.left = `${p.circle.pos.x}px`;
  popup.style.top = `${p.circle.pos.y}px`;
}

function removePopup() {
  popup.innerHTML = '';
}

function isHoverArea (p, options) {
  let { width, height, mouseY, mouseX } = options;

  let leftBorder = p.circle.pos.x - 10;
  let rightBorder = p.circle.pos.x + width;
  let topBorder = p.circle.pos.y - 10;
  let bottomBorder = p.circle.pos.y + height;

  return (mouseX > leftBorder) && (mouseX < rightBorder) && (mouseY > topBorder) && (mouseY < bottomBorder);
}
