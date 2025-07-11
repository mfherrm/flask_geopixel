import sys
import os

from app import create_app # type: ignore

# Configuration for database persistence
# Set to True to keep existing data on startup, False to clear all tables
persistData = False

app = create_app(persistent_data=persistData)

if __name__ == '__main__':
    app.run(debug=True)