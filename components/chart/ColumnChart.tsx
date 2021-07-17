import * as d3 from 'd3';

function rgb(rgba: string, a: number) {
  return rgba.replace(/,[0-9.]+\)$/, `,${a})`);
}
function rgba4(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}
function rgba(...args: unknown[]) {
  if(typeof args[0] === 'string') {
    return rgb(args[0], args[1] as number);
  }
  return rgba4(args[0] as number, args[1] as number, args[2] as number, args[3] as number);
}

type Rect1 = {
  x: number
  y: number
  width: number
  height: number
}
// type Rect2 = {
//   x1: number
//   y1: number
//   x2: number
//   y2: number
// }
type Coord = [number, number]
function isIn(rect: Rect1, [x,y]: Coord) {
  console.log(rect.x, rect.x + rect.width, rect.y, rect.y + rect.height)
  console.log(x, y)
  return (
    rect.x <= x && x <= (rect.x + rect.width) &&
    rect.y <= y && y <= (rect.y + rect.height)
  )
}

type dataByCategory = {
  name: string
  value: number
}[]

type Serie = {
  name: string
  data: number[]
}

type d3Selection = d3.Selection<SVGGElement, unknown, HTMLElement, any>

const colors = {
  deaths: rgba(0,0,255,0.5),
  serious: rgba(0,255,255,0.5),
  wounded: rgba(255,255,0,0.5),
  reported: rgba(255,0,255,0.5),
  count: rgba(255,0,0,0.5),
};

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

const CONTAINER_BBOX = new Boundary(
  0, 0, 500, 500
)
const X_AXIS_HEIGHT = 30;
const Y_AXIS_WIDTH = 60;
const LEGEND_HEIGHT = 20;
const LEGEND_ITEM_WIDTH = 80;
const LEGEND_ITEM_PADDING = 5;
const BODY_BBOX = new Boundary(
  CONTAINER_BBOX.x + Y_AXIS_WIDTH,
  CONTAINER_BBOX.y + 20,
  CONTAINER_BBOX.width - Y_AXIS_WIDTH - 10,
  CONTAINER_BBOX.height - X_AXIS_HEIGHT - LEGEND_HEIGHT - 20 - 20,
);

class ColumnChart {
  private _categories: string[]
  private _source: Serie[]
  private _data: dataByCategory[]

  private _d3: {
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>
    xScale: d3.ScaleBand<string>
    yScale: d3.ScaleLinear<number, number, never>
    columns: d3Selection
    legend: d3Selection
  }

  private _inactive: number[] = []

  constructor(
    selector: string,
    series: Serie[],
    categories?: string[],
  ) {
    this._categories = categories || series[0].data.map((_,i) => `${i}`);
    this._source = series;
    this._data = this._source.reduce((acc, serie, i) => {
      serie.data.forEach((dt,j) => {
        acc[j] || (acc[j] = []);
        acc[j].push({
          name: serie.name,
          value: dt,
        });
      });
      return acc;
    }, [] as {name: string, value: number}[][]);

    this._d3 = {} as ColumnChart['_d3'];

    this._d3.svg = d3.select(selector)
      .attr('viewBox', CONTAINER_BBOX.viewBoxString);

    
    this.setScales();
    this.appendAxises();
    this.appendColumns();
    this.appendLegend();

    this.setEventListeners();
  }

  getActualIndex(index: number) {
    return index - this._inactive.filter(n => n < index).length;
  }

  setScales() {
    this._d3.xScale = d3.scaleBand()
      .domain(this._categories)
      .range([BODY_BBOX.x1, BODY_BBOX.x2])
      .padding(0.1)

    const allData = this._source.reduce((acc, sr, i) => 
      this._inactive.includes(i) ? acc : [...acc, ...sr.data]
    , [] as number[]);

    this._d3.yScale = d3.scaleLinear()
      .domain([0, (d3.max(allData, dt => dt) || 0) * 1.05])
      .range([BODY_BBOX.y2, BODY_BBOX.y1])
  }

  appendAxises() {
    const xAxis = d3.axisBottom(this._d3.xScale)
      .tickSizeOuter(0)
    const yAxis = d3.axisLeft(this._d3.yScale)

    this._d3.svg.append('g')
      .classed('xAxis', true)
      .attr('transform', `translate(0,${BODY_BBOX.y2})`)
      .call(xAxis);

    this._d3.svg.append('g')
      .classed('yAxis', true)
      .attr('transform', `translate(${BODY_BBOX.x1},0)`)
      .transition()
      .call(yAxis);
  }

  appendColumns() {
    this._d3.columns = this._d3.svg.append('g')
      .classed('columns', true);

    this.updateColumns();
  }

  appendLegend() {
    this._d3.legend = this._d3.svg.append('g')
      .classed('legend', true)
      .call(g => {
        g.append('rect')
          .classed('wrapper', true);
        
        g.append('g')
          .classed('legendItems', true);
      })

    this.updateLegend();
  }

  updateAxises() {
    const xAxis = d3.axisBottom(this._d3.xScale)
      .tickSizeOuter(0)
    const yAxis = d3.axisLeft(this._d3.yScale)

    const ts = this._d3.svg.transition().duration(750);

    this._d3.svg
      .select<SVGGraphicsElement>('g.xAxis')
      .transition(ts)
      .call(xAxis);

    this._d3.svg
      .select<SVGGraphicsElement>('g.yAxis')
      .transition(ts)
      .call(yAxis)
  }

  updateColumns() {
    const ts = this._d3.svg.transition().duration(750);
    const columnWidth = this._d3.xScale.bandwidth() / (this._data[0].length - this._inactive.length);

    this._d3.columns
      .selectAll('g')
      .data(this._data)
      .join('g')
        .attr('transform', (_, i) => `translate(${this._d3.xScale(this._categories[i])},0)`)
        .selectAll('rect')
        .data(dt => dt)
        .join(
          enter => enter.append('rect')
            .attr('fill', (dt) => colors[dt.name as keyof typeof colors])
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', columnWidth)
            .attr('transform', (_,i) => `translate(${columnWidth * this.getActualIndex(i)},${this._d3.yScale(0)})`)
            .call(enter => enter
              .transition(ts)
              .attr('height', dt => this._d3.yScale(0) - this._d3.yScale(dt.value))
              .attr('transform', (dt,i) => `translate(${columnWidth * this.getActualIndex(i)},${this._d3.yScale(dt.value)})`)
            ),
          update => update.call(update => update
            .transition(ts)
            .attr('width', (_,i) =>
              this._inactive.includes(i) ? 0 : columnWidth
            )
            .attr('height', (dt,i) =>
              this._inactive.includes(i) ? 0 : this._d3.yScale(0) - this._d3.yScale(dt.value)
            )
            .attr('transform', (dt,i) =>
              this._inactive.includes(i) ?
                `translate(${columnWidth * this.getActualIndex(i)},${this._d3.yScale(0)})` :
                `translate(${columnWidth * this.getActualIndex(i)},${this._d3.yScale(dt.value)})`
            )
          ),
          exit => exit.call(exit =>
            exit.transition(ts)
              .attr('height', 0)
              .attr('transform', (dt,i) => `translate(${columnWidth * i},${this._d3.yScale(0)})`)
              .remove()
          )
        )
  }

  updateLegend() {
    const legendItems = this._d3.legend.select('g.legendItems');

    legendItems
      .selectAll('g.row')
      .data(this._source)
      .join('g')
        .classed('row', true)
        .attr('cursor', 'pointer')
        // .attr('transform', (d, i) => `translate(${100 * i},0)`)
        .call(g => {
          g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', (d, i) =>
              this._inactive.includes(i) ?
                rgba(192,192,192,1) :
                rgba(colors[d.name as keyof typeof colors], 1)
            )
          g.append('text')
            .attr('x', 15)
            .attr('y', 10)
            .attr('font-size', 10)
            .text(d => d.name)
            .attr('fill', (d, i) =>
              this._inactive.includes(i) ?
                rgba(192,192,192,1) :
                rgba(colors[d.name as keyof typeof colors], 1)
            )
        })

    legendItems
      .selectAll('g.row')
      .attr('transform', (d, i) => `translate(${LEGEND_ITEM_WIDTH*i},${0})`)
      .attr('id', (d, i) => `legendItemRow${i}`)

    const bbox = (legendItems.node() as SVGGraphicsElement).getBBox();

    const coordX = CONTAINER_BBOX.width / 2 - bbox.width / 2;
    const coordY = BODY_BBOX.y2 + X_AXIS_HEIGHT;

    this._d3.legend.select('rect.wrapper')
      .attr('x', coordX)
      .attr('y', coordY)
      .attr('width', bbox.width + LEGEND_ITEM_PADDING * 2)
      .attr('height', bbox.height + LEGEND_ITEM_PADDING * 2)
      .attr('fill', 'rgba(255,255,255,0.9)')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)

    legendItems
      .attr('transform', `translate(${coordX + LEGEND_ITEM_PADDING},${coordY + LEGEND_ITEM_PADDING})`)
  }

  toggleSeries(index: number){
    if(this._inactive.includes(index)) {
      this._inactive.splice(
        this._inactive.indexOf(index),
        1
      )
    } else {
      this._inactive.push(index);
    }

    this.setScales();
    this.updateAxises();
    this.updateColumns();
    this.updateLegend();
  }

  setEventListeners() {
    const _this = this;
    this._d3.legend.select('g.legendItems')
      .selectAll('g.row')
      .on('click', function() {
        const index = (this as SVGGraphicsElement).id.match(/[0-9]+$/)?.[0]
        if(index) {
          _this.toggleSeries(+index);
        }
      })
  }
}

export default ColumnChart;
