"""
NYC Subway Tracker - Backend API
Real-time subway arrival tracking using MTA GTFS feeds

Main endpoints:
- GET /api/stations - Returns list of all subway stations
- GET /api/arrivals?station_id=<id> - Returns real-time arrivals for a station
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from nyct_gtfs import NYCTFeed
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# API key is optional - MTA no longer requires it, but library needs empty string
MTA_API_KEY = os.getenv('MTA_API_KEY', '')

# MTA feed URLs for different subway lines
FEED_URLS = {
    '1,2,3,4,5,6,S': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
    'A,C,E,H,FS': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
    'N,Q,R,W': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
    'B,D,F,M': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm',
    'L': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
    'G': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
    'J,Z': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
    '7': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-7',
    'SIR': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si'
}

def get_feed_url_for_station(station_id):
    """
    Returns all feed URLs that might contain data for this station.
    We'll query all feeds to be comprehensive.
    """
    return list(FEED_URLS.values())

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Serve static files explicitly
@app.route('/style.css')
def serve_css():
    return send_from_directory('static', 'style.css')

@app.route('/app.js')
def serve_js():
    return send_from_directory('static', 'app.js')

@app.route('/api/arrivals', methods=['GET'])
def get_arrivals():
    """
    Get real-time arrival data for a specific station.
    
    Query Parameters:
        station_id (str): The MTA station ID (e.g., '127' for Times Sq-42 St)
    
    Returns:
        JSON with arrivals (next per route/direction) and all_arrivals (all in next 30 mins)
    """
    station_id = request.args.get('station_id')
    
    if not station_id:
        return jsonify({'error': 'station_id parameter is required'}), 400
    
    # Check if this station is part of a complex (multiple platforms)
    # Some stations have multiple station IDs for different platforms/lines
    station_ids_to_query = [station_id]
    try:
        with open('stations.json', 'r') as f:
            stations = json.load(f)
            for station in stations:
                if station['id'] == station_id:
                    if 'complex_ids' in station:
                        station_ids_to_query = station['complex_ids']
                    break
    except FileNotFoundError:
        pass
    
    try:
        all_arrivals = []
        feeds_checked = 0
        feeds_successful = 0
        
        # Query all feeds to get comprehensive data
        for feed_name, feed_url in FEED_URLS.items():
            feeds_checked += 1
            try:
                # Use API key (empty string works if not provided)
                feed = NYCTFeed(feed_url, api_key=MTA_API_KEY)
                feeds_successful += 1
                
                # Query all station IDs (handles both single stations and complexes)
                for query_station_id in station_ids_to_query:
                    # Get arrivals for the station (both directions)
                    # Station IDs typically end with N (northbound) or S (southbound)
                    for suffix in ['N', 'S']:
                        stop_id = f"{query_station_id}{suffix}"
                        
                        # Search through all trips for this stop
                        for trip in feed.trips:
                            for stop_time_update in trip.stop_time_updates:
                                if stop_time_update.stop_id == stop_id:
                                    arrival_time = stop_time_update.arrival
                                    if arrival_time:
                                        # Calculate minutes until arrival using CURRENT time
                                        current_time = datetime.now(arrival_time.tzinfo)
                                        minutes_until = int((arrival_time.timestamp() - current_time.timestamp()) / 60)
                                        
                                        # Only include future arrivals (ignore trains that already passed)
                                        if minutes_until >= -1:  # Allow 1 minute grace for "arriving now"
                                            # Use the trip headsign_text if available, otherwise fall back to N/S
                                            direction = trip.headsign_text if trip.headsign_text else ("Northbound" if suffix == 'N' else "Southbound")
                                            
                                            # Normalize express train routes (6X -> 6, 7X -> 7, etc.)
                                            route_id = trip.route_id
                                            if route_id.endswith('X'):
                                                route_id = route_id[:-1]  # Remove 'X' suffix
                                            
                                            arrival_info = {
                                                'route': route_id,
                                                'direction': direction,
                                                'arrival_time': arrival_time.strftime('%I:%M:%S %p'),
                                                'minutes_until_arrival': max(0, minutes_until)  # Don't show negative numbers
                                            }
                                            all_arrivals.append(arrival_info)
            
            except Exception as e:
                # Feed might be temporarily unavailable, continue with other feeds
                continue
        
        if not all_arrivals:
            return jsonify({
                'station_id': station_id,
                'arrivals': [],
                'message': 'No upcoming arrivals found. Please check the station ID.'
            })
        
        # Filter to only arrivals in the next 30 minutes
        arrivals_30min = [a for a in all_arrivals if a['minutes_until_arrival'] <= 30]
        
        # Sort by minutes until arrival
        arrivals_30min.sort(key=lambda x: x['minutes_until_arrival'])
        
        # Keep only the NEXT arrival for each (route, direction) pair for the summary view
        seen_pairs = set()
        unique_arrivals = []
        for arrival in arrivals_30min:
            pair = (arrival['route'], arrival['direction'])
            if pair not in seen_pairs:
                seen_pairs.add(pair)
                unique_arrivals.append(arrival)
        
        
        # Define canonical route order for display
        ROUTE_ORDER = ['1', '2', '3', '4', '5', '6', '7', 
                      'A', 'B', 'C', 'D', 'E', 'F', 'G', 
                      'J', 'Z', 'L', 'M', 'N', 'Q', 'R', 'W', 
                      'S', 'SIR', 'H', 'FS']
        
        def route_sort_key(arrival):
            route = arrival['route']
            # Get index in ROUTE_ORDER, or put at end if not found
            route_index = ROUTE_ORDER.index(route) if route in ROUTE_ORDER else 999
            # Sort by direction: prioritize certain keywords
            # Uptown/Northbound/Manhattan-bound come before Downtown/Southbound/Brooklyn-bound
            direction = arrival['direction'].lower()
            if any(word in direction for word in ['uptown', 'north', 'manhattan', 'inwood', 'harlem']):
                direction_index = 0
            elif any(word in direction for word in ['downtown', 'south', 'brooklyn', 'queens', 'coney']):
                direction_index = 1
            else:
                # For other directions, sort alphabetically
                direction_index = 2
            return (route_index, direction_index, arrival['direction'])
        
        # Sort by route order, then direction (N before S)
        unique_arrivals.sort(key=route_sort_key)
        
        # Also send all arrivals for filtering
        arrivals_30min.sort(key=route_sort_key)
        
        return jsonify({
            'station_id': station_id,
            'arrivals': unique_arrivals,  # Next arrival for each (route, direction)
            'all_arrivals': arrivals_30min  # All arrivals in next 30 mins for filtering
        })
        
    except Exception as e:
        return jsonify({'error': f'Error fetching arrivals: {str(e)}'}), 500

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """
    Return a comprehensive list of all NYC subway stations.
    
    Returns:
        JSON array of stations with id and name fields.
        Station complexes (like Times Sq) are pre-grouped in the data.
    """
    try:
        with open('stations.json', 'r') as f:
            stations = json.load(f)
        
        # For the API, only return id and name (hide complex_ids from frontend)
        stations_simple = [{'id': s['id'], 'name': s['name']} for s in stations]
        return jsonify(stations_simple)
    except FileNotFoundError:
        return jsonify({'error': 'Station data not found. Please run generate_stations.py first.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

