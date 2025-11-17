# 🚇 NYC Subway Tracker

A real-time web application for tracking NYC subway arrivals. Get live arrival times for any subway station in New York City.

![NYC Subway Tracker](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-lightgrey)

## Features

- 🔍 **Smart Search** - Type any station name with autocomplete suggestions
- 🚂 **Real-Time Data** - Live arrival times from MTA's GTFS feeds
- 🎯 **Station Complexes** - Automatically combines connected platforms (e.g., Times Sq-42 St shows all lines)
- 🎨 **Color-Coded** - Train lines displayed with official MTA colors
- 🔢 **Filter by Train** - Click any train to see all arrivals in the next 30 minutes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** - No database required, direct API queries

## Demo

1. Search for a station (e.g., "Times Square")
2. See next arrival for each train line
3. Click any train badge to see all upcoming trains for that line
4. Results grouped by direction with arrival times

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nyc-subway-tracker.git
cd nyc-subway-tracker
```

2. **Set up virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Generate station data**
```bash
python generate_stations.py
```
This downloads MTA's station data and creates `stations.json` with 445+ stations.

5. **Run the application**
```bash
python app.py
```

6. **Open in browser**
```
http://localhost:5000
```

## Usage

### Search for a Station
- Type station name (e.g., "Union Square", "Court Sq")
- Use autocomplete suggestions
- Press Enter or click "Get Arrivals"

### View Arrivals
- See next arrival for each train line and direction
- Time shown in minutes until arrival
- Color-coded by train line

### Filter by Train
- Click any train badge (e.g., "7") to see all arrivals for that line
- Grouped by direction
- Shows all trains arriving in the next 30 minutes
- Click "All" to return to summary view

## Technical Details

### Architecture

**Backend:**
- Flask web server
- GTFS-Realtime API integration via `nyct-gtfs` library
- Queries 9 different MTA feeds for comprehensive coverage
- Real-time data processing and deduplication

**Frontend:**
- Vanilla JavaScript (no frameworks)
- CSS Grid for responsive layout
- Autocomplete search with keyboard navigation

### API Endpoints

#### `GET /api/stations`
Returns list of all available stations
```json
[
  {"id": "127", "name": "Times Sq-42 St"},
  {"id": "635", "name": "14 St-Union Sq"}
]
```

#### `GET /api/arrivals?station_id={id}`
Returns arrival data for a specific station
```json
{
  "station_id": "127",
  "arrivals": [
    {
      "route": "1",
      "direction": "Uptown & The Bronx",
      "arrival_time": "02:15:30 PM",
      "minutes_until_arrival": 3
    }
  ],
  "all_arrivals": [...]
}
```

### Station Complexes

The app intelligently handles station complexes (multiple platforms with the same name):
- Times Sq-42 St: Combines 1,2,3,7,S,N,Q,R,W,A,C,E,B,D,F,M lines
- 14 St-Union Sq: Combines 4,5,6,L,N,Q,R,W lines
- Grand Central-42 St: Combines 4,5,6,7,S lines

### Data Sources

- **MTA GTFS-Realtime Feeds**: Live train positions and arrival predictions
- **MTA GTFS Static Data**: Station names and locations
- No API key required (as of 2024)

## File Structure

```
nyc-subway-tracker/
├── app.py                  # Flask backend
├── generate_stations.py    # Script to generate station data
├── requirements.txt        # Python dependencies
├── stations.json          # Station data (generated)
├── static/
│   ├── index.html         # Main page
│   ├── app.js             # Frontend logic
│   └── style.css          # Styling
└── README.md
```

## Configuration

### Optional: MTA API Key
While no longer required, you can set an API key if desired:

1. Create a `.env` file:
```
MTA_API_KEY=your_key_here
```

2. The app will automatically use it if present

## Development

### Regenerating Station Data

If MTA adds new stations or changes station configurations:

```bash
python generate_stations.py
```

This will:
1. Download latest GTFS static data
2. Query all real-time feeds
3. Combine and deduplicate stations
4. Identify station complexes
5. Generate updated `stations.json`

### Running in Production

For production deployment, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Known Issues & Limitations

- Some shuttle trains (H, FS, etc.) may have limited data
- Weekend/late night service changes may not be reflected immediately
- Arrival predictions depend on MTA feed quality

## Contributing

Contributions are welcome! We'd love your help making this project better.

**Quick Start:**
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes and test thoroughly
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines, code style, and development setup.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [MTA](https://www.mta.info/) for providing free GTFS data
- [nyct-gtfs](https://github.com/Andrew-Dickinson/nyct-gtfs) library for GTFS-Realtime parsing
- MTA train line colors based on official branding

## Troubleshooting

### "Station data not found" error
Run `python generate_stations.py` to create the station database.

### "No upcoming arrivals found"
- Check if the station has service at current time
- Try a major station like "Times Square" to test
- Verify internet connection for API access

### Slow loading
- First load may be slower as it queries all 9 MTA feeds
- Subsequent searches should be faster

## Contact

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ in NYC
