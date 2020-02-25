import { TweenMax, Power1 } from 'gsap';
import { Circle } from './Circle';

// inspiration https://codepen.io/filipemcribeiro/pen/Wwvrbj



const PADDING = 10;
const LINES = 3;


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
      let p = {x: px, originX: px, y: py, originY: py };
      points.push(p);
    }
  }

  // for each point find the 5 closest points
  for(let i = 0; i < points.length; i++) {
    let closest = [];
    let p1 = points[i];
    for(let j = 0; j < points.length; j++) {
      let p2 = points[j]
      if(!(p1 == p2)) {
        let placed = false;
        for(let k = 0; k < LINES; k++) {
          if(!placed) {
            if(closest[k] == undefined) {
              closest[k] = p2;
              placed = true;
            }
          }
        }

        for(let k = 0; k < LINES; k++) {
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
}

function addListeners() {
  //@todo add throttle
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('resize', resize);
}

function mouseMove(e) {
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  checkCollision(mouseX, mouseY);
}

function resize() {
  //@todo restart amimation
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
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
    drawLines(points[i]);
    points[i].circle.draw();
  }

  requestAnimationFrame(animate);
}

function movePoint(p) {
  // @todo try replace to anime.js
  let tween = TweenMax.to(p, 25+1*Math.random(), {
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


function getDistance(p1, p2) {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}


function checkCollision(mouseX, mouseY) {
  for(let i = 0; i < points.length; i++) {
    let p = points[i];

    let leftBorder = p.circle.pos.x - p.circle.radius - PADDING;
    let rightBorder = p.circle.pos.x + p.circle.radius + PADDING;
    let topBorder = p.circle.pos.y - p.circle.radius - PADDING;
    let bottomBorder = p.circle.pos.y + p.circle.radius + PADDING;

    if((mouseX > leftBorder) && (mouseX < rightBorder) && (mouseY > topBorder) && (mouseY < bottomBorder)) {
      p.isPause || tweens.get(p).pause();
      p.isPause = true;
      break;
    } else {
      p.isPause && tweens.get(p).resume();
      p.isPause = false;
    }
  }
}
