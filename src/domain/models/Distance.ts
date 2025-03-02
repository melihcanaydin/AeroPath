import { InvalidDistanceError } from '../errors/DistanceErrors';

export class Distance {
  private constructor(private readonly value: number) {}

  static fromKilometers(km: number): Distance {
    if (km < 0) throw new InvalidDistanceError(km);
    return new Distance(km);
  }

  getValue(): number {
    return this.value;
  }
} 