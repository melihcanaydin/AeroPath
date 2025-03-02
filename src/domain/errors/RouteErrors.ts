export class RouteError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

export class InvalidAirportError extends RouteError {
  constructor(airportCode: string) {
    super(`Invalid airport code: ${airportCode}`, 'INVALID_AIRPORT');
  }
}

export class NoRouteFoundError extends RouteError {
  constructor(from: string, to: string) {
    super(`No route found between ${from} and ${to}`, 'NO_ROUTE');
  }
} 