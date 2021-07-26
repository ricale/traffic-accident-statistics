import { useEffect, useState } from 'react';

import { ColumnChart } from 'components/chart';
import * as data from 'data/byMonth';
import fillWithZero from 'components/chart/fillWithZero';

// FIXME: duplicated
type Serie = {
  name: string
  data: number[]
}

type Data = Omit<typeof data.d2012[0], 'month'> & {
  yearmonth: string
}

function ByMonthPage() {
  const [source, setSource] = useState<Data[]>([]);
  useEffect(() => {
    console.log('>>> useEffect');
    const beginYear = 2012;
    const endYear = 2019;

    const accumulated = [...new Array(endYear - beginYear + 1)].reduce((acc: Data[], _, i) => {
      const year = i + beginYear;
      acc.push(
        ...data[`d${year}` as keyof typeof data].map(({month, ...it}) => ({
          ...it,
          yearmonth: `${year}${fillWithZero(month)}`
        }))
      )
      return acc;
    }, []);

    setSource(accumulated);
  }, [data]);

  const [chartData, setChartData] = useState<{
    series: Serie[]
    categories: string[]
  }>();

  useEffect(() => {
    if(source.length === 0) {
      return;
    }

    setChartData({
      series: (
        source.reduce((acc, item) => {
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
        ] as {name: string, data: number[]}[])
      ),
      categories: source.map(item => `${item.yearmonth}`),
    })
  }, [source]);

  return (
    !!chartData &&
      <ColumnChart
        {...chartData}
        />
  );
}

export default ByMonthPage;