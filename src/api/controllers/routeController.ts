import { Request, Response } from 'express';
import { RouteService } from '../../services/routeService';

export class RouteController {
    constructor(private routeService: RouteService) {}

    async getRoute(req: Request, res: Response) {
        try {
            const result = await this.routeService.processRouteRequest(req.body);
            return res.status(result.status).json(result.data);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}