import { useEffect } from "react";
import ColumnChartSvg from "./ColumnChartSvg";

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
  useEffect(() => {
    if(!series) {
      return;
    }

    new ColumnChartSvg(
      '#svg',
      series,
      categories,
    )

  }, [series, categories])
  return (
    <svg id='svg'></svg>
  )
}

export default ColumnChart;
