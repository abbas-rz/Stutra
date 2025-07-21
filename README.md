# 📚 Stutra - Student Tracker

A modern, Apple-inspired student tracking application built for schools and classrooms. Track student attendance, activities, and add notes with a beautiful, easy-to-use interface.

![Stutra Demo](https://via.placeholder.com/800x400/007AFF/FFFFFF?text=Stutra+Student+Tracker)

## ✨ What Can This App Do?

- **📋 Attendance Tracking**: Mark students as Present, Absent, in Washroom, doing Activities, or Bunking
- **⏰ Smart Timer**: Automatic 12-minute washroom timer that alerts you when time is up
- **📝 Student Notes**: Add private notes about each student that only teachers can see
- **🔍 Quick Search**: Find any student instantly by typing their name or admission number
- **📱 Works Everywhere**: Use on computers, tablets, or phones
- **☁️ Cloud Sync**: All data is automatically saved to the cloud (Firebase)
- **🎨 Beautiful Design**: Dark theme that's easy on the eyes

## 🚀 Quick Setup Guide for School Administrators

### Step 1: Prerequisites (What You Need)

Before starting, make sure you have:
- A computer with internet connection
- A Google account (Gmail account)
- About 30 minutes of time

### Step 2: Get the Code

1. **Download this project:**
   - Click the green "Code" button at the top of this page
   - Select "Download ZIP"
   - Extract the ZIP file to your computer (e.g., Desktop/stutra)

2. **Install Node.js:**
   - Go to [nodejs.org](https://nodejs.org)
   - Download and install the "LTS" version (the recommended one)
   - Restart your computer after installation

### Step 3: Set Up Firebase (Your Database)

Firebase will store all your student data safely in the cloud.

1. **Create a Firebase Project:**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Click "Create a project"
   - Name it something like "MySchool-StudentTracker"
   - Disable Google Analytics (not needed for this)
   - Click "Create project"

2. **Set Up Realtime Database:**
   - In your Firebase project, click "Realtime Database" from the left menu
   - Click "Create Database"
   - Choose "Start in test mode" for now
   - Select your region (closest to your location)

3. **Get Your Firebase Configuration:**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Name your app (e.g., "Stutra")
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
   - **IMPORTANT**: Copy the configuration code that appears. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key-here",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

### Step 4: Configure the App

1. **Open Command Prompt/Terminal:**
   - Windows: Press `Windows Key + R`, type `cmd`, press Enter
   - Mac: Press `Cmd + Space`, type `terminal`, press Enter

2. **Navigate to your project folder:**
   ```bash
   cd Desktop/stutra
   # (or wherever you extracted the files)
   ```

3. **Install the app:**
   ```bash
   npm install
   ```
   (This will take a few minutes to download everything needed)

4. **Create your environment file:**
   - In the stutra folder, create a new file called `.env.local`
   - Copy and paste this template, replacing the values with your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### Step 5: Run the App

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open in your browser:**
   - The app will automatically open at `http://localhost:5173`
   - If it doesn't open automatically, copy and paste that URL into your browser

3. **First time setup:**
   - The app comes with 12 sample students
   - You can edit their names by modifying the mock data in the code
   - Or start fresh and add your own students

## 📖 How to Use the App

### For Teachers/Administrators:

1. **Marking Attendance:**
   - Each student has a card with their photo and name
   - Click the colored buttons at the bottom of each card:
     - 🟢 Green circle = Present
     - 🔴 Red X = Absent  
     - 🔵 Blue icon = Washroom (starts 12-min timer)
     - 🟠 Orange clipboard = Activity
     - 🔴 Red running icon = Bunking

2. **Adding Notes:**
   - Click the 📝 note icon on any student card
   - Type your note and click "Add Note"
   - Notes are private and only visible to teachers
   - You can add multiple notes per student

3. **Activities:**
   - Click the activity button (clipboard icon)
   - Choose from: Library, Nurse/Medical, Counselor, ATL, or type a custom activity
   - Student status will show the specific activity

4. **Search:**
   - Use the search bar at the top to quickly find students
   - Type name or admission number

5. **Reset All:**
   - Click "All Present" button to mark everyone as present
   - Useful at the start of each class period

### Data Storage:
- All changes are automatically saved to Firebase
- Data persists between sessions
- Access from any device with the same login

## 🔧 Customization

### Adding Your Own Students:

Edit the file `src/services/googleSheets.ts` and replace the mock students:

```typescript
private getMockStudents(): Student[] {
  return [
    { id: 1, name: "Student Name", admission_number: "2024001", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
    // Add more students here...
  ];
}
```

### Changing Colors/Theme:
The app uses an Apple-inspired dark theme. To customize colors, edit the `appleTheme` section in `src/App.tsx`.

## 🚨 Troubleshooting

### Common Issues:

1. **"Command not found" error:**
   - Make sure Node.js is installed correctly
   - Restart your computer after installing Node.js

2. **Firebase connection errors:**
   - Double-check your `.env.local` file has the correct Firebase configuration
   - Make sure your Firebase Realtime Database is set up and in "test mode"

3. **App won't start:**
   - Make sure you're in the correct folder (`cd Desktop/stutra`)
   - Try running `npm install` again
   - Check that port 5173 isn't being used by another app

4. **Students not saving:**
   - Check your internet connection
   - Verify Firebase configuration is correct
   - Look at the browser console (F12) for error messages

### Getting Help:
- Check the browser console (press F12) for error messages
- Make sure your internet connection is stable
- Verify all Firebase setup steps were completed

## 🚀 Going Live (Optional)

To make the app available to other teachers:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

3. **Share the URL:**
   - Firebase will give you a URL like `https://your-project.web.app`
   - Share this with other teachers

## 📄 License

This project is free to use for educational purposes. Feel free to modify and adapt it for your school's needs.

## 💡 Support

If you need help setting this up for your school, please:
1. Check the troubleshooting section above
2. Look at the error messages in the browser console (F12)
3. Create an issue on this repository with details about your problem

---

**Made with ❤️ for educators and students**

# 📚 Stutra - Student Tracker

A modern, Apple-inspired student tracking application built with React, TypeScript, and Material-UI. Track student attendance, activities, and add notes with a sleek, dark-themed interface.

## ✨ Features

- **Student Management**: Track attendance status (Present, Absent, Washroom, Activity, Bunking)
- **Timer System**: Automatic 12-minute washroom timer
- **Activity Tracking**: Assign students to activities like Library, Nurse, Counselor, ATL
- **Notes System**: Add and manage notes for each student
- **Search**: Fuzzy search by student name or admission number
- **Google Sheets Integration**: Sync all data with Google Sheets
- **Apple-inspired Design**: Beautiful dark theme with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Console account (for Google Sheets integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stutra
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Sheets integration:
   - Create a Google Cloud Console project
   - Enable the Google Sheets API
   - Create a service account and download the JSON key file
   - Create a Google Sheets spreadsheet with the following columns:
     - A: Name
     - B: Admission Number
     - C: Photo URL
     - D: Status
     - E: Activity
     - F: Timer End
     - G: Notes (JSON array)

4. Configure environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your Google Sheets ID and service account key path.

5. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── NotesDialog.tsx      # Notes management dialog
│   └── ...
├── services/
│   └── googleSheets.ts      # Google Sheets API integration
├── App.tsx                  # Main application component
└── main.tsx                 # Application entry point
```

## 🎨 Design Features

- **Apple-inspired Theme**: Dark mode with iOS-style colors and typography
- **Smooth Animations**: Hover effects and transitions
- **Responsive Design**: Works on desktop and mobile devices
- **Card-based Layout**: Clean, organized student cards
- **Visual Status Indicators**: Color-coded status chips and icons

## 🔧 Technologies Used

- **Frontend**: React 19, TypeScript, Material-UI
- **Build Tool**: Vite
- **Styling**: Emotion (via MUI)
- **Search**: Fuse.js for fuzzy search
- **Backend**: Google Sheets API
- **Authentication**: Google Service Account

## 📝 Usage

### Managing Students

1. **Change Status**: Click on the status icons at the bottom of each student card
2. **Add Activity**: Click the activity icon and select or type a custom activity
3. **Add Notes**: Click the note icon to open the notes dialog
4. **Search**: Use the search bar to find students by name or admission number
5. **Mark All Present**: Use the "All Present" button to reset all students to present status

### Google Sheets Integration

The app automatically syncs with Google Sheets:
- Student data is loaded on app startup
- Changes are saved to Google Sheets in real-time
- Notes are stored as JSON arrays in the spreadsheet

## 🚀 Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service
3. Make sure to configure environment variables on your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
