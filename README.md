# Flask GeoPixel Application

A Flask web application for geospatial data processing with Docker support.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see configuration section)

## Quick Start with Docker

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual configuration values:
   - Set a secure `SECRET_KEY`
   - Configure your database connection
   - Add your API keys and external service URLs

3. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Open your browser to `http://localhost:5000`

## Alternative: Docker Only

If you prefer to run just the Flask app without the database service:

1. **Build the Docker image:**
   ```bash
   docker build -t flask-geopixel .
   ```

2. **Run the container:**
   ```bash
   docker run -p 5000:5000 \
     -e SECRET_KEY="your-secret-key" \
     -e DATABASE_URI="your-database-uri" \
     -e CADENZA_URI="your-cadenza-uri" \
     -e GEOPIXEL_API_URL="your-geopixel-url" \
     -e RUNPOD_API_KEY="your-runpod-key" \
     flask-geopixel
   ```

## Configuration

The application requires the following environment variables:

- `SECRET_KEY`: Flask secret key for session management
- `DATABASE_URI`: PostgreSQL connection string
- `CADENZA_URI`: Cadenza server URL
- `CADENZA_REPOSITORY_NAME`: Repository name in Cadenza
- `CADENZA_EXTERNAL_LINK_ID`: External link ID for Cadenza
- `GEOPIXEL_API_URL`: GeoPixel API endpoint
- `RUNPOD_API_KEY`: RunPod API key for processing

## Docker Features

The Dockerfile includes:
- System dependencies for OpenCV image processing
- PostgreSQL client libraries
- Proper host binding for containerized deployment
- Production-ready configuration

## Troubleshooting

- **Port conflicts**: Change the host port in `docker-compose.yml` if 5000 is already in use
- **Database connection**: Ensure your `DATABASE_URI` is correctly configured
- **OpenCV issues**: The Dockerfile includes all necessary system dependencies for OpenCV

## Development

For development, you can mount your code as a volume:

```bash
docker-compose up --build -d
```

This will run the application with your local code mounted for easier development.