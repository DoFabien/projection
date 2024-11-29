import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bboxFormat',
  standalone: true
})
export class BboxFormatPipe implements PipeTransform {
  transform(coords: [[number, number], [number, number]] | undefined, format: string): string {
    if (!coords) return '';
    
    const x_min = coords[0][0];
    const x_max = coords[1][0];
    const y_min = coords[0][1];
    const y_max = coords[1][1];

    switch (format) {
      case 'wkt':
        return `POLYGON(${x_min} ${y_min},${x_min} ${y_max},${x_max} ${y_max},${x_max} ${y_min},${x_min} ${y_min})`;
      case 'geojson':
        return `{"type": "Polygon","coordinates": [[${x_min}, ${y_min}], [${x_min}, ${y_max}], [${x_max}, ${y_max}],[${x_max}, ${y_min}],[${x_min}, ${y_min}]]}`;
      case 'xyMinMax':
        return `${x_min} ${y_min}, ${x_max} ${y_max}`;
      case 'yxMinMax':
        return `${y_min} ${x_min}, ${y_max} ${x_max}`;
      case 'overpassXML':
        return `<bbox-query e="${x_max}" n="${y_max}" s="${y_min}" w="${x_min}"/>`;
      case 'overpassQL':
        return `${y_min},${x_min},${y_max},${x_max}`;
      default:
        return '';
    }
  }
}