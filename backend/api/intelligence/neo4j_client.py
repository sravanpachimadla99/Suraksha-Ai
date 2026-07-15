import os
import logging
from neo4j import GraphDatabase, AsyncGraphDatabase

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = None

    async def connect(self):
        try:
            self.driver = AsyncGraphDatabase.driver(self.uri, auth=(self.user, self.password))
            await self.driver.verify_connectivity()
            logger.info("Connected to Neo4j database")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    async def close(self):
        if self.driver:
            await self.driver.close()
            logger.info("Closed Neo4j connection")

    def get_driver(self):
        return self.driver

client = Neo4jClient()
