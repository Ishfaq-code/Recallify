#!/usr/bin/env python3
"""
Simple test script to verify Entaract API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print("✅ Health Check:", response.json())
        return True
    except Exception as e:
        print("❌ Health Check Failed:", e)
        return False

def test_get_documents():
    """Test getting all documents"""
    try:
        response = requests.get(f"{BASE_URL}/api/documents")
        print("✅ Get Documents:", response.json())
        return True
    except Exception as e:
        print("❌ Get Documents Failed:", e)
        return False

def test_search():
    """Test search functionality"""
    try:
        search_data = {
            "query": "machine learning",
            "limit": 3
        }
        response = requests.post(f"{BASE_URL}/api/search", json=search_data)
        print("✅ Search:", response.json())
        return True
    except Exception as e:
        print("❌ Search Failed:", e)
        return False

def main():
    print("🧪 Testing Entaract API Endpoints")
    print("-" * 40)
    
    # Test basic endpoints
    test_health_check()
    test_get_documents()
    test_search()
    
    print("\n📝 To test PDF upload:")
    print("1. Start the backend: cd Backend && python run.py")
    print("2. Start the frontend: cd Frontend/frontend && npm run dev")
    print("3. Upload a PDF file through the web interface")
    
    print("\n🔧 API Documentation available at:")
    print(f"{BASE_URL}/docs")

if __name__ == "__main__":
    main() 