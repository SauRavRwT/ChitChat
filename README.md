# ChitChat

ChitChat is a React app that translates text messages into different languages instantly. It supports real-time text-to-text translation in a chat application.

## Features

- Text-to-text conversion
- Real-time translation
- Easy-to-use interface
- Supports multiple languages

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Python](https://www.python.org/downloads/)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/SauRavRwT/ChitChat.git
   cd ChitChat
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

### Scripts

- `npm start`: Runs the app in development mode at [http://localhost:3000](http://localhost:3000).
- `npm test`: Runs tests.
- `npm run build`: Builds the app for production.
- `npm run eject`: Ejects the build configuration.

## Server Setup

We are using a local server with Python. Follow these steps for installation:

> **Note:** If you are using Windows, use the default terminal (Command Prompt). For Debian/RedHat/Fedora, use any terminal.

1. Create a Python virtual environment:

   ```bash
   mkdir venv  # Create directory
   python -m venv venv  # Create virtual environment
   ```

2. Activate the virtual environment:

   ```bash
   source venv/bin/activate  # For Linux/Mac
   venv\Scripts\activate  # For Windows
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   pip install --upgrade torch transformers
   ```

4. Run your Python file:

   ```bash
   python App.py
   ```

You are now ready to use the server!

## Connecting React to Local Server

In the project you will see a `env.example` file, create a new file named `.env` and copy contents of `env.example` into it. In that file, you will see the following environment variables

```env
REACT_APP_BACKEND_URL=http://YOUR_IP_ADDRESS:8080
```

## Contributors

- ![Ravi kumar thakur](https://avatars.githubusercontent.com/u/100570959?s=64&v=4) [Ravi kumar thakur](https://github.com/Ravithakurofficial)
- ![Ravita Upadhyay](https://avatars.githubusercontent.com/u/147539414?s=64&v=4) [Ravita Upadhyay](https://github.com/ravitaupadhyay)

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/SauRavRwT/ChitChat/blob/master/LICENSE) file for details.
