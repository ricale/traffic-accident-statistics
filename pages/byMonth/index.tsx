import { useEffect } from 'react';

import { ColumnChart } from 'components/chart';
import * as data from 'data/byMonth';

function ByMonthPage() {
  console.log('data', data.d2019)
  useEffect(() => {
    const series = data.d2019.reduce((acc, item) => {
      // acc[0].data.push(item.count);
      // const keys = ['deaths', 'serious', 'wounded', 'reported'];
      // for(let i = 0; i < acc.length; i++) {
      //   acc[i].data.push(item[]);
      // }
      acc[0].data.push(item.deaths);
      acc[1].data.push(item.serious);
      acc[2].data.push(item.wounded);
      acc[3].data.push(item.reported);
      return acc;
    }, [
      // {name: 'count', data: []},
      {name: 'deaths', data: []},
      {name: 'serious', data: []},
      {name: 'wounded', data: []},
      {name: 'reported', data: []},
    ] as {name: string, data: number[]}[]);

    const categories = data.d2019.map(item => `${item.month}`);

    const chart = new ColumnChart(
      '#svg',
      series,
      categories,
    );
  }, []);
  return (
    <svg id='svg'></svg>
  );
}

export default ByMonthPage;