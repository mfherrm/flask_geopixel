import sys
import os

from app import create_app # type: ignore

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)