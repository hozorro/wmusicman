export function barChart(cvs: HTMLCanvasElement, data: [string, number | [number,number]][]) {
  let values = data.map(item => Array.isArray(item[1]) ? item[1] : [item[1]]);
  const max_len = Math.max(...values.map(item => item.length));
  values = values.map(item => item.length < max_len ? [...item, ...new Array(max_len - item.length).fill(0)] : item);
  const series_name: string[] = data.map(item => item[0]);
  let series: number[][] = []
  for(let i = 0; i < max_len; i++) {
    series.push(values.map(item => item[i]));
  }
  const series_max = series.map(item => Math.max(...item));

  let ctx = cvs.getContext('2d');
  if(!ctx) return;
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "grey";
  
  let margin = 30
  let x_min = margin
  let x_max = cvs.width - margin
  let y_min = margin
  let y_max = cvs.height - margin;

  ctx.moveTo(x_min, y_max);
  ctx.lineTo(x_max, y_max);
  ctx.stroke();

  let bar_width = ((x_max - x_min) / series_name.length - 20) / series.length;
  let xs: number[][] = []
  let ys: number[][] = []
  let fs = (x_max - x_min - bar_width * series.length * series_name.length) / (2 * series_name.length);

  for(let i = 0; i < series.length; i++) { 
    let xs_cols: number[] = [];
    let ys_cols: number[] = [];
    for(let j = 0; j < series_name.length; j++) {
      xs_cols.push(x_min + j * (bar_width * series.length + fs * 2) + fs + i * bar_width);
      ys_cols.push(y_max - series[i][j] / series_max[i] * (y_max - y_min));
    }
    xs.push(xs_cols);
    ys.push(ys_cols);
  }
  let colors = ["coral", "darkcyan", 'lightseagreen']
  for(let j = 0; j < series_name.length; j++) {
    ctx.fillStyle = "black";
    ctx.fillText(series_name[j], xs[0][j] + bar_width * series.length / 2, y_max + 15);
    for(let i = 0; i < series.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(xs[i][j], ys[i][j], bar_width, y_max - ys[i][j]);
      ctx.fillText(series[i][j].toString(), xs[i][j] + bar_width / 2, ys[i][j] - 5);
    }
  }
}