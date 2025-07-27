#!/usr/bin/env python3
"""
Environment Setup Helper
Helps locate or create the .env file for Firebase configuration
"""

import os
from pathlib import Path

def find_env_files():
    """Find existing .env files"""
    possible_paths = [
        Path.cwd() / '.env',
        Path(__file__).parent / '.env', 
        Path(__file__).parent.parent / '.env',
        Path(__file__).parent.parent.parent / '.env',
    ]
    
    found = []
    for path in possible_paths:
        if path.exists():
            found.append(path)
    
    return found

def check_firebase_url(env_path):
    """Check if .env file contains Firebase URL"""
    try:
        with open(env_path, 'r') as f:
            content = f.read()
            return 'VITE_FIREBASE_DATABASE_URL' in content
    except:
        return False

def create_env_file():
    """Create a .env file with user input"""
    print("🔧 Creating .env file...")
    
    # Ask for Firebase URL
    firebase_url = input("Enter your Firebase Database URL: ").strip()
    
    if not firebase_url:
        print("❌ Firebase URL is required")
        return False
    
    # Choose location
    locations = [
        ("Project root", Path(__file__).parent.parent),
        ("Scripts directory", Path(__file__).parent),
        ("Current directory", Path.cwd())
    ]
    
    print("\nWhere would you like to create the .env file?")
    for i, (name, path) in enumerate(locations, 1):
        print(f"{i}. {name} ({path})")
    
    try:
        choice = int(input("Choose (1-3): ")) - 1
        if choice < 0 or choice >= len(locations):
            raise ValueError()
        
        env_path = locations[choice][1] / '.env'
        
        # Create .env content
        env_content = f"""# Firebase Configuration
VITE_FIREBASE_DATABASE_URL={firebase_url}

# Optional: Other Firebase config
# VITE_FIREBASE_API_KEY=your_api_key_here
# VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=your-project-id
"""
        
        # Write file
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created .env file at: {env_path}")
        return True
        
    except (ValueError, KeyboardInterrupt):
        print("❌ Invalid choice or cancelled")
        return False

def main():
    print("🔍 Environment Setup Helper")
    print("=" * 30)
    
    # Check for existing .env files
    existing = find_env_files()
    
    if existing:
        print(f"📁 Found {len(existing)} .env file(s):")
        for i, path in enumerate(existing, 1):
            has_firebase = check_firebase_url(path)
            status = "✅ Has Firebase URL" if has_firebase else "❌ Missing Firebase URL"
            print(f"{i}. {path} - {status}")
        
        print("\nWhat would you like to do?")
        print("1. Use existing .env file")
        print("2. Create new .env file")
        print("3. Show current environment variables")
        
        try:
            choice = input("Choose (1-3): ").strip()
            
            if choice == "1":
                print("👍 Using existing .env file(s)")
                print("💡 Make sure VITE_FIREBASE_DATABASE_URL is set correctly")
                
            elif choice == "2":
                create_env_file()
                
            elif choice == "3":
                print("\n🔧 Current environment variables:")
                firebase_url = os.getenv('VITE_FIREBASE_DATABASE_URL')
                if firebase_url:
                    print(f"VITE_FIREBASE_DATABASE_URL = {firebase_url}")
                else:
                    print("VITE_FIREBASE_DATABASE_URL = (not set)")
                    
        except KeyboardInterrupt:
            print("\n👋 Cancelled")
    else:
        print("📁 No .env files found")
        print("\nWould you like to create one? (y/n): ", end="")
        
        try:
            if input().lower().startswith('y'):
                create_env_file()
            else:
                print("💡 You can manually create a .env file with:")
                print("VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/")
        except KeyboardInterrupt:
            print("\n👋 Cancelled")

if __name__ == "__main__":
    main()
