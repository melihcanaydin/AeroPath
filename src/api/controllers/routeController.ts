import { Request, Response } from 'express';
import { IRouteService } from '../../domain/interfaces/services/IRouteService';

export class RouteController {
    constructor(private readonly routeService: IRouteService) {}

    async getRoute(req: Request, res: Response): Promise<Response> {
        try {
            const from = req.params.from;
            const to = req.params.to;
            const withGroundHops = req.query['with-ground-hops'] === 'true';

            if (!from || !to) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const result = await this.routeService.findShortestRoute(from, to, withGroundHops);
            return res.status(result.status).json(result.data);
        } catch (error) {
            console.error('Route calculation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}