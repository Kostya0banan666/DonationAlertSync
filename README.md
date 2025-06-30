# DonationAlertSync

A simple Node.js server to display real-time donation alerts.

## Features
- User registration and login using sessions and JWT
- Customize alert settings
- Dashboard shows total donations and last donation
- Real-time donation feed via WebSockets
- Data stored in JSON files (`data/users.json`, `data/logs.json`)

## Usage
1. Install dependencies (internet access required):
   ```bash
   npm install express express-session jsonwebtoken bcryptjs ws body-parser
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Visit `http://localhost:3000/register` to create a user.
4. Use the API key displayed on `/home` to send POST requests to `/:username`.

Due to environment limitations in this repository, dependencies are not
preinstalled. Ensure you run `npm install` before starting the server.
