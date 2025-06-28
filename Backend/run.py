#!/usr/bin/env python3
"""
Simple run script for the Entaract backend server
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Entaract Backend Server...")
    print("📄 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    print("📋 Upload Endpoint: http://localhost:8000/api/upload-pdf")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",  # Import string instead of app object
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    ) 