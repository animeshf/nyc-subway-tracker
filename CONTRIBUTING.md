# Contributing to NYC Subway Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/nyc-subway-tracker.git
   cd nyc-subway-tracker
   ```

2. **Set up development environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python generate_stations.py
   ```

3. **Run the development server**
   ```bash
   python app.py
   # Server will run on http://localhost:5000
   ```

## Project Structure

```
nyc-subway-tracker/
├── app.py                  # Flask backend - handles API requests
├── generate_stations.py    # Script to generate/update station data
├── stations.json          # Station database (445+ stations)
├── static/
│   ├── index.html         # Main page structure
│   ├── app.js             # Frontend logic (search, filters, API calls)
│   └── style.css          # Styling and responsive design
├── requirements.txt        # Python dependencies
└── start.sh               # Quick startup script
```

## Development Guidelines

### Code Style

**Python (Backend)**
- Follow PEP 8 style guide
- Use descriptive variable names
- Add docstrings to functions
- Keep functions focused and single-purpose

**JavaScript (Frontend)**
- Use ES6+ features
- Use `const` and `let` (avoid `var`)
- Add comments for complex logic
- Keep functions small and testable

**CSS**
- Use meaningful class names
- Group related styles together
- Add comments for major sections
- Mobile-first responsive design

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Test thoroughly
   - Update documentation if needed

3. **Test your changes**
   - Run the app locally
   - Test on different browsers (Chrome, Firefox, Safari)
   - Test on mobile devices
   - Try different stations and edge cases

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: description of your changes"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub with a clear description

## Areas for Contribution

### Backend Improvements
- [ ] Caching layer to reduce API calls
- [ ] Service status/alerts from MTA
- [ ] Historical data tracking
- [ ] Performance optimizations
- [ ] Better error handling and retry logic

### Frontend Enhancements
- [ ] Dark mode toggle
- [ ] Favorite stations (localStorage)
- [ ] Share station link feature
- [ ] PWA (Progressive Web App) support
- [ ] Accessibility improvements (ARIA labels)
- [ ] Route maps/visualizations

### Data & Features
- [ ] Nearby stations based on location
- [ ] Service change notifications
- [ ] Weekend/late night schedule awareness
- [ ] Train crowding data (if available)
- [ ] Walking directions between stations

### DevOps
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Deployment documentation
- [ ] Monitoring and logging

## API Documentation

### GET /api/stations
Returns all available subway stations.

**Response:**
```json
[
  {"id": "127", "name": "Times Sq-42 St"},
  {"id": "635", "name": "14 St-Union Sq"}
]
```

### GET /api/arrivals?station_id={id}
Returns real-time arrival data for a station.

**Parameters:**
- `station_id` (required): MTA station ID

**Response:**
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

## Data Sources

- **MTA GTFS-Realtime**: Live train positions
- **MTA GTFS Static**: Station names and locations
- No API key required (as of 2024)

### Regenerating Station Data

If MTA adds new stations or changes configurations:

```bash
python generate_stations.py
```

This will:
1. Download latest GTFS data
2. Query all real-time feeds
3. Identify station complexes
4. Generate updated `stations.json`

## Testing

### Manual Testing Checklist
- [ ] Search autocomplete works
- [ ] All train filters work
- [ ] Refresh button updates data
- [ ] Mobile responsive layout
- [ ] Error messages display properly
- [ ] Multiple station complexes work (Times Sq, Union Sq, etc.)
- [ ] Both directions show for each train

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## Reporting Issues

When reporting bugs, please include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/device information**
5. **Screenshots (if applicable)**

## Questions?

- Open an issue on GitHub
- Check existing issues for similar questions
- Review the README.md for setup instructions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NYC Subway Tracker! 🚇

