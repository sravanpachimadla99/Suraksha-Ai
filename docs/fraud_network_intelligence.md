# Fraud Network Intelligence

## Overview
The Fraud Network Intelligence module leverages Graph AI to uncover hidden relationships between cyber criminals, victims, and digital infrastructure (phones, bank accounts, IPs).

## Graph Schema
- **Nodes**: Person, Phone Number, Email, Bank Account, UPI ID, Debit Card, Credit Card, Device ID, IMEI, IP Address, MAC Address, QR Code, Website, Domain, Complaint, Transaction, Location, Organization.
- **Relationships**: USES, OWNS, REGISTERED_WITH, CONNECTED_TO, TRANSFERRED_TO, LOGGED_IN_FROM, CONTACTED, VISITED, RELATED_TO, REPORTED_BY, TARGETED, SHARED_DEVICE, SHARED_IP.

## AI Analytics & Community Detection
The backend implements graph traversal algorithms via Neo4j:
- **Shortest Path**: Finding the most direct connection between a reported victim and a known scammer.
- **PageRank**: Identifying highly central nodes (e.g., a "hub" bank account receiving funds from many sources).
- **Connected Components**: Detecting isolated clusters of fraudulent activity.
- **High-Risk Clusters**: Aggregating threat levels of connected nodes to identify active Money Mule Networks or Device Farms.

## Security
- **Role-Based Access**: Accessible ONLY by Police, Bank Officers, Telecom Officers, and Administrators.
- **Citizen Access**: Disabled.

## API Endpoints
- `POST /api/v1/graph/import`: Import nodes and relationships.
- `GET /api/v1/graph/network`: Get full graph layout.
- `GET /api/v1/graph/high-risk`: Filter graph by high-risk nodes.
