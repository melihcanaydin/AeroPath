import { RouteError } from './RouteErrors';

export class InvalidDistanceError extends RouteError {
  constructor(distance: number) {
    super(`Invalid distance value: ${distance}`, 'INVALID_DISTANCE');
  }
} 