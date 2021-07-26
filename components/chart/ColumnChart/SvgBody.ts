import * as d3 from 'd3';

import Boundary from '../Boundary';
import rgba from '../rgba';

type DataByCategory = {
  name: string
  value: number
}

type Serie = {
  name: string
  data: number[]
}

type d3Selection = d3.Selection<SVGGElement, unknown, HTMLElement, any>

const colors = {
  deaths: rgba('#723e73',1),
  serious: rgba('#c04671',1),
  wounded: rgba('#f6674f',1),
  reported: rgba('#ffa600',1),
  count: rgba('#003f5c',1),
};

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

function getUniqueId() {
  // const date = new Date();
  return `${new Date().getTime()}-${Math.floor(Math.random() * 10000)}`
}

type ChartData = {
  category: string
  data: DataByCategory[]
}
type ColumnChartSvgConstructorProps = {
  selector: string
  series: Serie[]
  categories?: string[]
  range?: [string, string]
}

class ColumnChartSvg {
  private _id: string
  private _deleted = false

  private _categories: string[]
  private _source: Serie[]
  private _data: ChartData[]
  private _range: [string, string]

  private _clipId: string
  private _d3: {
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>
    // xScale: d3.ScaleBand<string>
    xScale: d3.ScaleLinear<number, number, never>
    yScale: d3.ScaleLinear<number, number, never>
    columns: d3Selection
    legend: d3Selection
    tooltip: d3Selection
  }

  private _inactive: number[] = []
  private _overed?: {
    dx: number,
    dy: number,
    data: ChartData
  }

  constructor({
    selector,
    series,
    categories,
    range,
  }: ColumnChartSvgConstructorProps) {
    this._id = getUniqueId()
    console.log(this._id, '>>> constructor')

    this._categories = categories || series[0].data.map((_,i) => `${i}`);
    this._source = series;
    this._data = this._source.reduce((acc, serie, i) => {
      serie.data.forEach((dt,j) => {
        acc[j] || (acc[j] = {
          category: this._categories[j],
          data: [],
        });
        acc[j].data.push({
          name: serie.name,
          value: dt,
        });
      });
      return acc;
    }, [] as ChartData[]);

    this._range = range || [this._categories[0], this._categories[this._categories.length - 1]];

    this._d3 = {} as ColumnChartSvg['_d3'];

    this._d3.svg = d3.select(selector)
      .attr('viewBox', CONTAINER_BBOX.viewBoxString);
    this._d3.svg.selectAll('*').remove();
    
    this.setScales();
    this.appendAxises();
    this.appendColumns();
    this.appendLegend();
    this.appendTooltip();

    this.setEventListeners();
  }

  private getActualIndex(index: number) {
    return index - this._inactive.filter(n => n < index).length;
  }

  private getXDomain() {
    const beginIndex = this._categories.findIndex(cat => cat === this._range[0])
    const endIndex = this._categories.findIndex(cat => cat === this._range[1])
    // return this._categories.slice(beginIndex, endIndex + 1);
    return [beginIndex, endIndex]
  }

  private setScales() {
    // this._d3.xScale = d3.scaleBand()
    //   .domain(this.getXDomain())
    //   .range([BODY_BBOX.x1, BODY_BBOX.x2])
    //   .padding(0.05)

    this._d3.xScale = d3.scaleLinear()
      .domain(this.getXDomain())
      .range([BODY_BBOX.x1, BODY_BBOX.x2])

    const allData = this._source.reduce((acc, sr, i) => 
      this._inactive.includes(i) ? acc : [...acc, ...sr.data]
    , [] as number[]);

    this._d3.yScale = d3.scaleLinear()
      .domain([0, (d3.max(allData, dt => dt) || 0) * 1.05])
      .range([BODY_BBOX.y2, BODY_BBOX.y1])
  }

  private appendAxises() {
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

  private appendColumns() {
    this._clipId = 'columnChartClipPathId';
    this._d3.svg.append('clipPath')
      .attr('id', this._clipId)
      .append('rect')
        .attr('x', BODY_BBOX.x)
        .attr('y', BODY_BBOX.y)
        .attr('width', BODY_BBOX.width)
        .attr('height', BODY_BBOX.height);

    this._d3.columns = this._d3.svg.append('g')
      .classed('columns', true)
      .attr('clip-path', `url(#${this._clipId})`);

    this.updateColumns();
  }

  private appendLegend() {
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

  private appendTooltip() {
    this._d3.tooltip = this._d3.svg.append('g')
      .classed('tooltip', true)
      .call(g => {
        g.append('rect')
          .classed('wrapper', true);

        g.append('g')
          .classed('tooltipContent', true)
          .call(g => {
            g.append('text').classed('labels', true);
            g.append('text').classed('values', true);
          });
      })
  }

  private updateAxises() {
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

  private updateColumns() {
    const ts = this._d3.svg.transition().duration(750);
    // const columnWidth = this._d3.xScale.bandwidth() / (this._data[0].data.length - this._inactive.length);
    const groupWidth = (
      this._d3.xScale(this._categories.indexOf(this._data[1].category)) -
      this._d3.xScale(this._categories.indexOf(this._data[0].category))
    );
    const columnWidth = (
      groupWidth / 
      (this._data[0].data.length - this._inactive.length)
    );

    const activeCategories = this.getXDomain();

    const groups = this._d3.columns
      .selectAll('g')
      .data(this._data)
      // .join(
      //   enter => enter.append('g')
      //     .attr('transform', (dt) => {
      //       const dx = this._d3.xScale(dt.category);
      //       return dx ? `translate(${dx},0)` : 0;
      //     }),
      //   update => update.call(g => g
      //     .transition(ts)
      //     .attr('transform', (dt) => {
      //       const dx = this._d3.xScale(dt.category);
      //       return dx ? `translate(${dx},0)` : `translate(${0},0)`;
      //     })
      //   ),
      //   exit => exit.call(g => g
      //     .transition(ts)
      //     .attr('transform', (dt) => 'translate(0,0)')
      //     .remove()
      //   )
      // )
      .join(
        enter => enter.append('g')
          .attr('transform', (dt) => {
            const dx = this._d3.xScale(this._categories.indexOf(dt.category));
            return dx ? `translate(${dx},0)` : 0;
          }),
        update => update.call(g => g
          .transition(ts)
          .attr('transform', (dt) => {
            const dx = this._d3.xScale(this._categories.indexOf(dt.category));
            return dx ? `translate(${dx},0)` : `translate(${0},0)`;
          })
        ),
        exit => exit.call(g => g
          .transition(ts)
          .attr('transform', (dt) => 'translate(0,0)')
          .remove()
        )
      )
        

    // const outranged = groups.filter(dt => !activeCategories.includes(dt.category))
    // const ranged = groups.filter(dt => activeCategories.includes(dt.category))

    const ranged = groups;

    ranged
      .selectAll('rect.columnArea')
      .data([null])
      .join('rect')
        .classed('columnArea', true);

    ranged
      .selectAll('rect.columnRect')
      .data(dt => dt.data)
      .join(
        enter => enter.append('rect')
          .classed('columnRect', true)
          .attr('fill', (dt) => colors[dt.name as keyof typeof colors])
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', columnWidth)
          .attr('transform', (_,i) => `translate(${columnWidth * this.getActualIndex(i)},${this._d3.yScale(0)})`)
          .call(g => g && g
            .transition(ts)
            .attr('height', dt => this._d3.yScale(0) - this._d3.yScale(dt.value))
            .attr('transform', (dt,i) => `translate(${columnWidth * this.getActualIndex(i)},${this._d3.yScale(dt.value)})`)
          ),
        update => update.call(g => g && g
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
        exit => exit.call(g => g && g
          .transition(ts)
          .attr('height', 0)
          .attr('transform', (dt,i) => `translate(${columnWidth * i},${this._d3.yScale(0)})`)
          .remove()
        )
      )

    ranged
      .selectAll('rect.columnArea')
      .data([null])
      .join('rect')
        .classed('columnArea', true)
        .attr('transform', (_, i) => `translate(${0},${BODY_BBOX.y1})`)
        // .attr('width', this._d3.xScale.step())
        .attr('width', groupWidth)
        .attr('height', BODY_BBOX.height)
        .attr('fill', rgba(0,0,0,0))
  }

  private updateLegend() {
    const legendItems = this._d3.legend.select('g.legendItems');

    legendItems
      .selectAll('g.row')
      .data(this._source)
      .join('g')
        .classed('row', true)
        .attr('cursor', 'pointer')
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

    try {
      // FIXME: hot reloading 과정에서 예외가 터진다.
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
    } catch(err) {
      console.error(this._id, err);
    }
  }

  private updateTooltip() {
    if(!this._overed) {
      this._d3.tooltip.style('display', 'none');
      return;
    }

    this._d3.tooltip.style('display', null);

    const {
      dx,
      dy,
      data,
    } = this._overed;

    const activeData = data.data.filter((_,i) => !this._inactive.includes(i))

    const tooltipContent = this._d3.tooltip.select('g.tooltipContent');
    const tooltipRect = this._d3.tooltip.select('rect.wrapper');
    const tooltipLabels = tooltipContent.select('text.labels');
    const tooltipValues = tooltipContent.select('text.values');

    const names = activeData.map(dt => dt.name) || [];
    const values = activeData.map(dt => dt.value) || [];

    tooltipLabels
      .selectAll('tspan')
      .data(names)
      .join('tspan')
        .attr('x', 0)
        .attr('y', (_,i) => i * 10)
        .attr('font-size', 10)
        .text(d => d)

    tooltipValues
      .selectAll('tspan')
      .data(values)
      .join('tspan')
        .attr('x', 0)
        .attr('y', (_,i) => i * 10)
        .attr('font-size', 10)
        .attr('text-anchor', 'end')
        .text(d => d)

    const padding = 4;

    const labelsBBox = (tooltipLabels.node() as SVGGraphicsElement).getBBox();
    const valuesBBox = (tooltipValues.node() as SVGGraphicsElement).getBBox();

    tooltipValues
      .attr('transform', `translate(${labelsBBox.width + valuesBBox.width + padding}, 0)`);

    const contentBBox = (tooltipContent.node() as SVGGraphicsElement).getBBox();

    tooltipRect
      .attr('width', contentBBox.width + padding * 2)
      .attr('height', contentBBox.height + padding * 2)
      .attr('stroke', '#000')
      .attr('fill', rgba(255,255,255,0.9))
      .attr('transform', `translate(${contentBBox.x - padding}, ${contentBBox.y - padding})`)

    let x = dx;
    if(x < BODY_BBOX.x1) {
      x = BODY_BBOX.x1;
    }
    if(BODY_BBOX.x2 < x + contentBBox.width) {
      x = BODY_BBOX.x2 - contentBBox.width;
    }

    let y = dy - contentBBox.height - 5;
    if(y < BODY_BBOX.y1) {
      y = BODY_BBOX.y1 + contentBBox.height + 30;
    }
    if(BODY_BBOX.y2 < y) {

    }

    this._d3.tooltip
      .attr('transform', `translate(${x}, ${y})`)
  }

  private toggleSeries(index: number){
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

  private setEventListeners() {
    const _this = this;
    this._d3.legend.select('g.legendItems')
      .selectAll('g.row')
      .on('click', function() {
        const index = (this as SVGGraphicsElement).id.match(/[0-9]+$/)?.[0]
        if(index) {
          _this.toggleSeries(+index);
        }
      })

    this._d3.columns
      .on('mousemove', function(event) {
        const group = d3.select(event.target.parentNode);
        const [ dx, dy ] = d3.pointer(event);
        // group.selectAll('rect.columnRect').attr('stroke', '#000');

        _this._overed = {
          dx: dx,
          dy: dy,
          data: group.data()[0] as ChartData,
        }
        _this.updateTooltip();
      })
      .on('mouseout', function(event) {
        const group = d3.select(event.target.parentNode);
        group.selectAll('rect').attr('stroke', null);

        _this._overed = undefined;
        _this.updateTooltip();
      })
  }

  setXRange(range: [string, string]) {
    console.log(this._id, '>>> setXRange')
    if(this._deleted) {
      return;
    }

    this._range = range;

    this.setScales();
    this.updateAxises();
    this.updateColumns();
    this.updateLegend();
  }

  clear() {
    console.log(this._id, '>>> clear')
    if(this._deleted) {
      return;
    }

    this._deleted = true;
    this._d3.svg.remove();
    this._d3.columns.remove();
    this._d3.legend.remove();
    this._d3.tooltip.remove();
  }
}

export default ColumnChartSvg;
