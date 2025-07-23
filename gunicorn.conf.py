"""
Gunicorn configuration for Flask GeoPixel application
Optimized for high-throughput tile processing
"""

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.environ.get('FLASK_PORT', 5000)}"
backlog = 2048

# Worker processes - optimized for Docker containers
workers = min(4, multiprocessing.cpu_count())  # Max 4 workers for Docker stability
worker_class = "sync"  # Use sync for CPU-intensive tile processing
worker_connections = 1000
timeout = 300  # 5 minutes for long-running tile processing
keepalive = 30

# Performance optimizations
max_requests = 1000
max_requests_jitter = 50
preload_app = True  # Load application code before forking workers

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "gunicorn_geopixel"

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# Worker recycling for memory management
max_requests = 1000
max_requests_jitter = 50

print(f"🚀 Gunicorn configured with {workers} workers for high-performance tile processing")