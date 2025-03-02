import { Route } from '../../models/Route';
import { Airport } from '../../models/Airport';

export interface IRouteRepository {
  findRoutes(from: Airport, to: Airport): Promise<Route[]>;
  findAll(): Promise<Route[]>;
} 