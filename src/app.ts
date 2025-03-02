import express from 'express';
import morgan from 'morgan';
import { RouteController } from './api/controllers/routeController';
import { errorHandler } from './api/middlewares/errorHandler';
import { container } from './config/dependencyContainer';

export async function createApp() {
    const app = express();

    const routeController = new RouteController(container.routeService);

    app.use(morgan('tiny'));
    app.use(express.json());
    app.use(container.requestTracker.handle);

    app.get('/health', (_, res) => res.send('OK'));
    app.get('/routes/:from/:to', routeController.getRoute.bind(routeController));

    app.use(errorHandler);

    return app;
}
