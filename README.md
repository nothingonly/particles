# Living Particle App

This project was generated for you. Since `npm` is not available in your current environment shell, you must run the following commands in a terminal where Node.js is installed (e.g., your local machine's VS Code terminal or Command Prompt).

## Project Setup

1.  **Navigate to the project folder:**
    ```bash
    cd living-particle-app
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd functions
    npm install
    cd ..
    ```

## Firebase Setup

1.  **Login to Firebase:**
    ```bash
    npm install -g firebase-tools
    firebase login
    ```

2.  **Set your Gemini API Key:**
    You must have a Gemini API key from Google AI Studio.
    
    *Option A (Local Emulator):*
    Create a file `.env` in the `functions/` folder (or use `functions/.env`) and add:
    ```
    GEMINI_API_KEY=your_actual_api_key_here
    ```
    
    *Option B (Deployed):*
    ```bash
    firebase functions:config:set gemini.key="your_key"
    ```
    (Note: The code currently uses `process.env.GEMINI_API_KEY`. For deployed functions 2nd gen, use Secrets or Environment variables via the Firebase console).

## Running the App

1.  **Start the Backend (Emulators):**
    Open a new terminal in the `living-particle-app` folder:
    ```bash
    firebase emulators:start --only functions
    ```
    *Keep this terminal open.* Note the URL of the `analyzeMood` function (usually `http://127.0.0.1:5001/...`). Ensure this URL matches the one in `src/App.jsx`.

2.  **Start the Frontend:**
    Open a second terminal in the `living-particle-app` folder:
    ```bash
    npm run dev
    ```
    Open the localhost URL provided (e.g., `http://localhost:5173`).

## Usage
1.  Allow Microphone access when prompted.
2.  Click "Start Listening".
3.  Speak a phrase (e.g., "I am feeling so happy today!").
4.  Watch the particles morph and change color!
