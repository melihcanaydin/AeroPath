import { RouteController } from '../../../api/controllers/routeController';
import { Request, Response } from 'express';
import { IRouteService } from '../../../domain/interfaces/services/IRouteService';

describe('RouteController', () => {
    let routeController: RouteController;
    let mockRouteService: jest.Mocked<IRouteService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        mockRouteService = {
            findShortestRoute: jest.fn()
        };

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockResponse = {
            status: statusMock,
            json: jsonMock
        };

        routeController = new RouteController(mockRouteService);
    });

    it('should handle valid route request', async () => {
        mockRequest = {
            params: { from: 'TLL', to: 'SFO' },
            query: { 'with-ground-hops': 'false' }
        };

        const mockResult = {
            status: 200,
            data: {
                source: 'TLL',
                destination: 'SFO',
                distance: 1000,
                hops: ['TLL', 'SFO']
            }
        };

        mockRouteService.findShortestRoute.mockResolvedValue(mockResult);

        await routeController.getRoute(mockRequest as Request, mockResponse as Response);

        expect(mockRouteService.findShortestRoute).toHaveBeenCalledWith('TLL', 'SFO', false);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(mockResult.data);
    });

    it('should handle missing parameters', async () => {
        mockRequest = {
            params: { from: 'TLL' },
            query: {}
        };

        await routeController.getRoute(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing required parameters' });
    });
}); 