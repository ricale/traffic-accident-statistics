import { svg } from "d3";
import { useEffect, useMemo, useState } from "react";
import SvgBody from "./SvgBody";

type SelectProps = {
  options: {
    label: string
    value: string
  }[] | string[]
  value: string
  onChangeValue: (value: string) => void
}
function Select({
  options,
  onChangeValue,
  ...props
}: SelectProps) {
  return (
    <select {...props} onChange={evt => onChangeValue(evt.target.value)}>
      {options.map(opt =>
        <option key={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      )}
    </select>
  )
}

type Serie = {
  name: string
  data: number[]
}

type ColumnChartProps = {
  series: Serie[]
  categories: string[]
}
function ColumnChart({
  series,
  categories,
}: ColumnChartProps) {
  const [range, setRange] = useState<[string, string]>([categories[0], categories[categories.length - 1]]);

  const [svgBody, setSvgBody] = useState<SvgBody>();
  useEffect(() => {
    console.log(`${new Date().getTime()}`, 'useEffect')
    if(!series) {
      return;
    }

    console.log(`${new Date().getTime()}`, 'before setSvgBody');
    setSvgBody(old => {
      console.log(`${new Date().getTime()}`, 'setSvgBody')
      if(old) {
        old.clear();
      }
      // FIXME: svg 셀렉터를 직접 붙이는 게 아니라 container 셀렉터를 통해 svg 를 생성하도록
      return new SvgBody({
        selector: '#svg',
        series,
        categories,
        range,
      })
    });
  }, [series]);

  useEffect(() => {
    svgBody?.setXRange(range);
  }, [range]);

  return (
    <div>
      <Select
        options={categories}
        value={range[0]}
        onChangeValue={(value) => setRange(rg => [value, rg[1]])}
        />

      <Select
        options={categories}
        value={range[1]}
        onChangeValue={(value) => setRange(rg => [rg[0], value])}
        />
      <svg id='svg'></svg>
    </div>
  )
}

export default ColumnChart;
