import { parse }from 'csv-parse';
import { readFile } from 'fs';
import { resolve as resolvePath } from 'path';

import { notNil, haversine } from '../util';

export interface Airport {
  id: string;
  icao: string | null;
  iata: string | null;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Route {
  source: Airport;
  destination: Airport;
  distance: number;
}

function parseCSV<T extends Readonly<string[]>>(filePath: string, columns: T): Promise<{ [key in T[number]]: string }[]> {
  return new Promise((resolve, reject) => {
    readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }

      parse(data, { columns: Array.from(columns), skip_empty_lines: true, relax_column_count: true }, (err, rows) => {
        if (err) {
          return reject(err);
        }

        resolve(rows);
      });
    });
  });
}

export async function loadAirportData(): Promise<Airport[]> {
  const columns = ['id', 'name', 'city', 'country', 'iata', 'icao', 'latitude', 'longitude'] as const;
  const rows = await parseCSV(resolvePath(__dirname, '../../src/data/airports.dat'), columns);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    city: row.city,
    country: row.country,
    iata: row.iata === '\\N' ? null : row.iata,
    icao: row.icao === '\\N' ? null : row.icao,
    location: {
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude)
    }
  })).filter(airport => airport.iata || airport.icao);
}

export async function loadRouteData(): Promise<Route[]> {
  const airports = await loadAirportData();
  // Create maps for both ID and IATA lookups
  const airportsById = new Map<string, Airport>();
  const airportsByCode = new Map<string, Airport>();

  airports.forEach(airport => {
    airportsById.set(airport.id, airport);
    if (airport.iata) airportsByCode.set(airport.iata, airport);
    if (airport.icao) airportsByCode.set(airport.icao, airport);
  });

  const columns = ['airline', 'airlineID', 'source', 'sourceID', 'destination', 'destinationID', 'codeshare', 'stops'] as const;
  const rows = await parseCSV(resolvePath(__dirname, '../../src/data/routes.dat'), columns);

  return rows
    .filter((row) => row.stops === '0')
    .map((row) => {
      // Try to find airports by both ID and code
      const source = airportsById.get(row.sourceID) || airportsByCode.get(row.source);
      const destination = airportsById.get(row.destinationID) || airportsByCode.get(row.destination);

      if (!source || !destination) {
        return null;
      }

      return {
        source,
        destination,
        distance: haversine(
          source.location.latitude, source.location.longitude,
          destination.location.latitude, destination.location.longitude,
        ),
      }
    })
    .filter(notNil);
}
