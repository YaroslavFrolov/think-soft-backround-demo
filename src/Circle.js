export class Circle {
  constructor({ ctx, position, radius }){
    this.pos = position || null;
    this.radius = radius || null;
    this.ctx = ctx;
  }

  draw() {
    if (!this.active) return null;
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = `rgba(255,255,255, ${this.active}`; //@tode rename "active" to "opacity" pp
    this.ctx.fill();
  }
}
