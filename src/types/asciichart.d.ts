declare module 'asciichart' {
  interface PlotConfig {
    height?: number;
    width?: number;
    offset?: number;
    padding?: string;
    colors?: any[];
    format?: (n: number, i?: number) => string;
  }

  export function plot(series: number[] | number[][], config?: PlotConfig): string;

  export const red: any;
  export const green: any;
  export const blue: any;
  export const yellow: any;
  export const magenta: any;
  export const cyan: any;
  export const lightgray: any;
  export const defaultColor: any;
  export { defaultColor as default };
}
