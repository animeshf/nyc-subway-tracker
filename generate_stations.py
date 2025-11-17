#!/usr/bin/env python3
"""
Generate a comprehensive list of subway stations from all MTA feeds
Uses GTFS static data (stops.txt) for station names
"""
from nyct_gtfs import NYCTFeed
import json
import csv

FEED_URLS = {
    '1,2,3,4,5,6,S': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
    'A,C,E': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
    'N,Q,R,W': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
    'B,D,F,M': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm',
    'L': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
    'G': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
    'J,Z': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
    '7': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-7'
}

# Load station names from GTFS stops.txt
print("Loading station names from stops.txt...")
STATION_NAMES = {
    '101': 'Van Cortlandt Park-242 St',
    '103': '238 St',
    '104': '231 St',
    '106': 'Marble Hill-225 St',
    '107': '215 St',
    '109': '207 St',
    '110': 'Dyckman St',
    '111': '191 St',
    '112': '181 St',
    '113': '168 St',
    '114': '157 St',
    '115': '145 St',
    '116': '137 St-City College',
    '117': '125 St',
    '118': '116 St',
    '119': 'Cathedral Pkwy',
    '120': '103 St',
    '121': '96 St',
    '122': '86 St',
    '123': '79 St',
    '124': '72 St',
    '125': '66 St-Lincoln Center',
    '126': '59 St-Columbus Circle',
    '127': 'Times Square-42 St',
    '128': '34 St-Penn Station',
    '129': '28 St',
    '130': '23 St',
    '131': '18 St',
    '132': '14 St',
    '133': 'Christopher St',
    '134': 'Houston St',
    '135': 'Canal St',
    '136': 'Franklin St',
    '137': 'Chambers St',
    '138': 'WTC Cortlandt',
    '139': 'Rector St',
    '140': 'South Ferry',
    '142': 'Wall St',
    '224': 'Fulton St',
    '423': 'Atlantic Av-Barclays Ctr',
    '635': 'Grand Central-42 St',
    '640': '51 St',
    '621': '59 St',
    '626': '86 St',
    '629': '96 St',
    '631': '103 St',
    '633': '110 St',
    '636': '125 St',
    'A02': 'Inwood-207 St',
    'A03': 'Dyckman St',
    'A05': '190 St',
    'A06': '181 St',
    'A07': '175 St',
    'A09': '168 St',
    'A10': '163 St-Amsterdam',
    'A11': '155 St',
    'A12': '145 St',
    'A14': '135 St',
    'A15': '125 St',
    'A16': '116 St',
    'A17': 'Cathedral Pkwy',
    'A18': '103 St',
    'A19': '96 St',
    'A20': '86 St',
    'A21': '81 St',
    'A22': '72 St',
    'A24': '59 St-Columbus Circle',
    'A25': '50 St',
    'A27': '42 St-Port Authority',
    'A28': '34 St-Penn Station',
    'A30': '23 St',
    'A31': '14 St',
    'A32': 'W 4 St',
    'A33': 'Spring St',
    'A34': 'Canal St',
    'A36': 'Chambers St',
    'A38': 'Fulton St',
    'A40': 'High St',
    'A41': 'Jay St-MetroTech',
    'A42': 'Hoyt-Schermerhorn',
    'D01': 'Norwood-205 St',
    'D03': 'Bedford Park Blvd',
    'D04': 'Kingsbridge Rd',
    'D05': 'Fordham Rd',
    'D06': '182-183 Sts',
    'D07': 'Tremont Av',
    'D08': '174-175 Sts',
    'D09': '170 St',
    'D10': '167 St',
    'D11': '161 St-Yankee Stadium',
    'D12': '155 St',
    'D13': '145 St',
    'D14': '135 St',
    'D15': '125 St',
    'D16': '116 St',
    'D17': 'Cathedral Pkwy',
    'D18': '103 St',
    'D19': '96 St',
    'D20': '86 St',
    'D21': '81 St',
    'D22': '72 St',
    'D24': '59 St-Columbus Circle',
    'D25': '50 St',
    'D26': '47-50 Sts-Rockefeller Ctr',
    'D27': '42 St-Bryant Park',
    'D28': '34 St-Herald Sq',
    'R01': 'Astoria-Ditmars Blvd',
    'R03': 'Astoria Blvd',
    'R04': '30 Av',
    'R05': 'Broadway',
    'R06': '36 Av',
    'R08': '39 Av',
    'R09': 'Beebe Av',
    'R11': 'Steinway St',
    'R13': '46 St',
    'R14': 'Lexington Av/53 St',
    'R15': '5 Av/53 St',
    'R16': '57 St-7 Av',
    'R17': '49 St',
    'R18': 'Times Square-42 St',
    'R19': '34 St-Herald Sq',
    'R20': '28 St',
    'R21': '23 St',
    'R22': '14 St-Union Sq',
    'R23': '8 St-NYU',
    'R24': 'Prince St',
    'R25': 'Canal St',
    'R26': 'City Hall',
    'R27': 'Cortlandt St',
    'R28': 'Rector St',
    'R29': 'Whitehall St',
    'R30': 'Court St',
    'R31': 'Jay St-MetroTech',
    'L01': '8 Av',
    'L02': '6 Av',
    'L03': 'Union Sq-14 St',
    'L05': '3 Av',
    'L06': '1 Av',
    'L08': 'Bedford Av',
    'L10': 'Lorimer St',
    'G05': 'Court Sq',
    'G06': '21 St',
    'G07': 'Greenpoint Av',
    'G08': 'Nassau Av',
    'G09': 'Metropolitan Av',
    'G10': 'Broadway',
    'G11': 'Flushing Av',
    'G12': 'Myrtle-Willoughby Avs',
    'G13': 'Bedford-Nostrand Avs',
    'G14': 'Classon Av',
    'G15': 'Clinton-Washington Avs',
    'G16': 'Fulton St',
}

# Parse stops.txt to get ALL station names
try:
    with open('stops.txt', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            stop_id = row['stop_id']
            stop_name = row['stop_name']
            location_type = row['location_type']
            
            # Only get station entries (location_type=1) which don't have N/S suffix
            if location_type == '1':
                STATION_NAMES[stop_id] = stop_name
    
    print(f"✓ Loaded {len(STATION_NAMES)} station names from stops.txt")
except FileNotFoundError:
    print("⚠ stops.txt not found, using limited station names")

print("\nFetching station data from all feeds...")
print("=" * 60)

all_stop_ids = set()

for lines, feed_url in FEED_URLS.items():
    try:
        print(f"\nFetching {lines} feed...")
        feed = NYCTFeed(feed_url, api_key='')
        
        for trip in feed.trips:
            for stop_time in trip.stop_time_updates:
                # Remove N/S suffix to get base stop ID
                base_id = stop_time.stop_id[:-1] if stop_time.stop_id[-1] in ['N', 'S'] else stop_time.stop_id
                all_stop_ids.add(base_id)
        
        print(f"  ✓ Found stops for {lines} lines")
    except Exception as e:
        print(f"  ✗ Error: {e}")

print(f"\n{'=' * 60}")
print(f"Total unique station IDs found: {len(all_stop_ids)}")

# Create station list with known names
stations = []
for stop_id in sorted(all_stop_ids):
    name = STATION_NAMES.get(stop_id, f"Station {stop_id}")
    stations.append({'id': stop_id, 'name': name})

print(f"Stations with names: {len([s for s in stations if 'Station ' not in s['name']])}")
print(f"\nSample stations:")
for station in stations[:10]:
    print(f"  {station['id']}: {station['name']}")

# Save to file
with open('stations.json', 'w') as f:
    json.dump(stations, f, indent=2)

print(f"\n✓ Saved {len(stations)} stations to stations.json")

