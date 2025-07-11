import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PostGISDatabase:
    """PostGIS database connection and management class"""
    
    def __init__(self, host='localhost', port=5432, user='postgres', password='postgres', database='postgres'):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.connection_string = f"host={host} port={port} user={user} password={password} dbname={database}"
        
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = psycopg2.connect(self.connection_string)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def test_connection(self) -> bool:
        """Test if database connection is working"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    logger.info("Database connection test successful")
                    return result[0] == 1
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def ensure_postgis_extension(self):
        """Ensure PostGIS extension is installed"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if PostGIS extension exists
                    cursor.execute("""
                        SELECT EXISTS(
                            SELECT 1 FROM pg_extension WHERE extname = 'postgis'
                        )
                    """)
                    exists = cursor.fetchone()[0]
                    
                    if not exists:
                        logger.info("Installing PostGIS extension...")
                        cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis")
                        conn.commit()
                        logger.info("PostGIS extension installed successfully")
                    else:
                        logger.info("PostGIS extension already installed")
        except Exception as e:
            logger.error(f"Error installing PostGIS extension: {e}")
            raise
    
    def get_all_object_tables(self) -> List[str]:
        """Get list of all object table names based on the dropdown options"""
        # All object types from the dropdown
        object_types = [
            # Transportation
            'aircraft', 'car', 'ship', 'train',
            # Infrastructure
            'bridge', 'building', 'city', 'factory', 'highway', 'hospital',
            'house', 'parking_lot', 'road', 'runway', 'solar_panel', 'warehouse', 'wind_turbine',
            # Natural Features
            'beach', 'canyon', 'coastline', 'hill', 'island', 'lake', 'mountain',
            'ocean', 'river', 'valley', 'wetland',
            # Vegetation
            'farmland', 'forest', 'garden', 'grass', 'park', 'pasture', 'tree', 'vineyard',
            # Urban Features
            'cemetery', 'commercial', 'construction_site', 'golf_course', 'industrial',
            'residential', 'sports_field', 'stadium', 'urban_area',
            # Geological
            'desert', 'erosion', 'landslide', 'mine', 'quarry', 'rock_formation', 'sand',
            # Environmental
            'fire', 'flood', 'ice', 'shadow', 'smoke', 'snow',
            # Agriculture
            'barn', 'greenhouse', 'livestock', 'silo',
            # Miscellaneous
            'misc'
        ]
        
        # Convert to table names (lowercase with underscores)
        table_names = []
        for obj_type in object_types:
            table_name = obj_type.lower().replace(' ', '_')
            table_names.append(table_name)
        
        return table_names
    
    def drop_all_tables(self):
        """Drop all object tables if they exist"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    table_names = self.get_all_object_tables()
                    
                    for table_name in table_names:
                        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
                        logger.info(f"Dropped table: {table_name}")
                    
                    conn.commit()
                    logger.info(f"Successfully dropped {len(table_names)} tables")
        except Exception as e:
            logger.error(f"Error dropping tables: {e}")
            raise
    
    def create_all_tables(self):
        """Create all object tables with geometry column"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    table_names = self.get_all_object_tables()
                    
                    for table_name in table_names:
                        # Create table with geometry column
                        create_table_sql = f"""
                            CREATE TABLE IF NOT EXISTS {table_name} (
                                id SERIAL PRIMARY KEY,
                                geom GEOMETRY(MULTIPOLYGON, 3857),
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                attributes JSONB DEFAULT '{{}}'::jsonb
                            )
                        """
                        cursor.execute(create_table_sql)
                        
                        # Create spatial index
                        cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_geom ON {table_name} USING GIST (geom)")
                        
                        logger.info(f"Created table: {table_name}")
                    
                    conn.commit()
                    logger.info(f"Successfully created {len(table_names)} tables")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise
    
    def initialize_database(self, clear_data=True):
        """Initialize database: ensure PostGIS, optionally drop tables, create tables"""
        try:
            if clear_data:
                logger.info("Initializing database with data clearing...")
            else:
                logger.info("Initializing database with data persistence...")
            
            # Test connection
            if not self.test_connection():
                raise Exception("Database connection failed")
            
            # Ensure PostGIS extension
            self.ensure_postgis_extension()
            
            # Conditionally drop all existing tables based on clear_data parameter
            if clear_data:
                logger.info("Clearing existing data...")
                self.drop_all_tables()
            else:
                logger.info("Preserving existing data...")
            
            # Create all tables (will only create tables that don't exist)
            self.create_all_tables()
            
            if clear_data:
                logger.info("Database initialization completed successfully - data cleared")
            else:
                logger.info("Database initialization completed successfully - data preserved")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    def object_name_to_table_name(self, object_name: str) -> str:
        """Convert object name from dropdown to table name"""
        # Handle invalid object names
        if not object_name or object_name.lower() in ['object', 'select object', '']:
            return 'building'  # Default to building table
        return object_name.lower().replace(' ', '_')
    
    def insert_geometry(self, object_name: str, geometry_wkt: str, attributes: Optional[Dict[str, Any]] = None):
        """Insert geometry into the corresponding table"""
        try:
            table_name = self.object_name_to_table_name(object_name)
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Prepare attributes
                    attrs = attributes or {}
                    attrs_json = psycopg2.extras.Json(attrs)
                    
                    # Insert geometry
                    insert_sql = f"""
                        INSERT INTO {table_name} (geom, attributes) 
                        VALUES (ST_GeomFromText(%s, 3857), %s)
                        RETURNING id
                    """
                    cursor.execute(insert_sql, (geometry_wkt, attrs_json))
                    geometry_id = cursor.fetchone()[0]
                    
                    conn.commit()
                    logger.info(f"Inserted geometry {geometry_id} into table {table_name}")
                    return geometry_id
                    
        except Exception as e:
            logger.error(f"Error inserting geometry into {table_name}: {e}")
            raise
    
    def get_geometries_count(self, object_name: str) -> int:
        """Get count of geometries in a table"""
        try:
            table_name = self.object_name_to_table_name(object_name)
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    count = cursor.fetchone()[0]
                    return count
                    
        except Exception as e:
            logger.error(f"Error getting count from {table_name}: {e}")
            return 0
    
    def get_all_geometries(self, object_name: str) -> List[Dict[str, Any]]:
        """Get all geometries from a table"""
        try:
            table_name = self.object_name_to_table_name(object_name)
            
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(f"""
                        SELECT id, ST_AsText(geom) as geometry_wkt, created_at, attributes
                        FROM {table_name}
                        ORDER BY created_at DESC
                    """)
                    results = cursor.fetchall()
                    return [dict(row) for row in results]
                    
        except Exception as e:
            logger.error(f"Error getting geometries from {table_name}: {e}")
            return []
    
    def calculate_area_intersection(self, object_name1: str, object_name2: str) -> Dict[str, Any]:
        """Calculate area intersection between two object tables"""
        try:
            table_name1 = self.object_name_to_table_name(object_name1)
            table_name2 = self.object_name_to_table_name(object_name2)
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Calculate intersection
                    intersection_sql = f"""
                        WITH layer1_union AS (
                            SELECT ST_Union(geom) as geom FROM {table_name1}
                        ),
                        layer2_union AS (
                            SELECT ST_Union(geom) as geom FROM {table_name2}
                        ),
                        intersection AS (
                            SELECT ST_Intersection(l1.geom, l2.geom) as geom
                            FROM layer1_union l1, layer2_union l2
                            WHERE ST_Intersects(l1.geom, l2.geom)
                        )
                        SELECT 
                            ST_Area(l1.geom) as area1,
                            ST_Area(l2.geom) as area2,
                            COALESCE(ST_Area(i.geom), 0) as intersection_area,
                            (SELECT COUNT(*) FROM {table_name1}) as count1,
                            (SELECT COUNT(*) FROM {table_name2}) as count2
                        FROM layer1_union l1, layer2_union l2
                        LEFT JOIN intersection i ON true
                    """
                    
                    cursor.execute(intersection_sql)
                    result = cursor.fetchone()
                    
                    if result:
                        area1, area2, intersection_area, count1, count2 = result
                        
                        # Calculate percentages
                        layer1_overlap_percentage = (intersection_area / area1 * 100) if area1 > 0 else 0
                        layer2_overlap_percentage = (intersection_area / area2 * 100) if area2 > 0 else 0
                        
                        return {
                            'layer1Area': area1,
                            'layer2Area': area2,
                            'intersectionArea': intersection_area,
                            'layer1PolygonCount': count1,
                            'layer2PolygonCount': count2,
                            'layer1OverlapPercentage': layer1_overlap_percentage,
                            'layer2OverlapPercentage': layer2_overlap_percentage
                        }
                    else:
                        return {
                            'layer1Area': 0,
                            'layer2Area': 0,
                            'intersectionArea': 0,
                            'layer1PolygonCount': 0,
                            'layer2PolygonCount': 0,
                            'layer1OverlapPercentage': 0,
                            'layer2OverlapPercentage': 0
                        }
                        
        except Exception as e:
            logger.error(f"Error calculating intersection between {table_name1} and {table_name2}: {e}")
            raise

# Global database instance
db = PostGISDatabase()

def get_database() -> PostGISDatabase:
    """Get the global database instance"""
    return db

def initialize_database(clear_data=True):
    """Initialize the database on startup"""
    try:
        db.initialize_database(clear_data=clear_data)
        logger.info("Database initialized successfully on startup")
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {e}")
        # Don't raise here - let the application start even if database fails
        # The user will see errors when trying to use Cadenza features