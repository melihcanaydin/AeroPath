import { Airport } from './Airport';
import { Distance } from './Distance';
import { haversine } from '../../utils/haversine';

export class Route {
  constructor(
    private readonly _source: Airport,
    private readonly _destination: Airport,
    private readonly _hops: Airport[],
    private readonly _distance: Distance
  ) {}

  get source(): Airport {
    return this._source;
  }

  get destination(): Airport {
    return this._destination;
  }

  get hops(): Airport[] {
    return [...this._hops];
  }

  getDistance(): number {
    return this._distance.getValue();
  }

  isValid(): boolean {
    return this._hops.length <= 5;
  }

  static create(source: Airport, destination: Airport, path: Airport[]): Route {
    const distance = Distance.fromKilometers(
      path.reduce((total, _, index) => {
        if (index === 0) return 0;
        const prev = path[index - 1];
        const curr = path[index];
        return total + this.calculateDistance(prev, curr);
      }, 0)
    );

    return new Route(source, destination, path, distance);
  }

  private static calculateDistance(from: Airport, to: Airport): number {
    return haversine(
      from.location.latitude,
      from.location.longitude,
      to.location.latitude,
      to.location.longitude
    );
  }
} 