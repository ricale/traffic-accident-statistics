class Boundary {
  private pane: {
    x: number
    y: number
    width: number
    height: number
  }
  constructor(x: number, y: number, width: number, height: number, options = {}) {
    this.pane = {
      x,
      y,
      width,
      height,
    };
    // this.xAxis = {
    //   x: 0,
    //   y: this.pane.y + this.pane.height + (options.xAxisOffsetY || 0),
    // }
  }

  get x() {
    return this.pane.x;
  }
  get y() {
    return this.pane.y;
  }
  get width() {
    return this.pane.width;
  }
  get height() {
    return this.pane.height;
  }

  get x1() {
    return this.pane.x;
  }
  get y1() {
    return this.pane.y;
  }

  get x2() {
    return this.pane.x + this.pane.width;
  }
  get y2() {
    return this.pane.y + this.pane.height;
  }

  get viewBoxString() {
    return `${this.x} ${this.y} ${this.width} ${this.height}`
  }
}

export default Boundary;
