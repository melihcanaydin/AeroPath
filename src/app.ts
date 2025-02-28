import express from 'express';
import { RouteController } from './api/controllers/routeController';
import { RouteService } from './services/routeService';
import { DistanceService } from './services/distanceService';
import { errorHandler } from './api/middlewares/errorHandler';

const app = express();
app.use(express.json());

const distanceService = new DistanceService();
const routeService = new RouteService(distanceService);
const routeController = new RouteController(routeService);

app.post('/api/shortest-route', routeController.findShortestRoute.bind(routeController));
app.use(errorHandler);

export default app;
