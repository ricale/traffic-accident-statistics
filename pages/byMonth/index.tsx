import { useEffect } from 'react';
import * as d3 from 'd3';

import * as data from 'data/byMonth';

function ByMonthPage() {
  console.log('data', data.d2019)
  useEffect(() => {
    const svg = d3.select('#svg')
      .attr('viewBox', [0, 0, 500, 500].join(' '))

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data.d2019, dt => dt.month) as [number, number])
      .range([100, 400])

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data.d2019, dt => dt.deaths) as [number, number])
      .range([400, 100])

    const xAxis = (g: d3.Selection<SVGGElement, unknown, HTMLElement, any>) => g
      .attr('transform', `translate(0,${400})`)
      .call(
        d3.axisBottom(xScale)
          .tickSizeOuter(0)
      );
    svg.append('g').call(xAxis)

    // svg.append()

  }, []);
  return (
    <svg id='svg'></svg>
  );
}

export default ByMonthPage;