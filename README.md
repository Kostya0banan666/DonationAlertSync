# DonationAlertSync

A simple Node.js server to display real-time donation alerts.

## Features
- User registration and login using sessions and JWT
- Customize alert settings
- Dashboard shows total donations, donation count and last donation
- Real-time donation feed via WebSockets
- Data stored in JSON files (`data/users.json`, `data/logs.json`)

## Usage
1. Install dependencies (internet access required):
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Visit `http://localhost:3000/register` to create a user.
4. Use the API key displayed on `/home` to send POST requests to `/:username`.

## Docker
You can build a container image and run it:
```bash
docker build -t donationalert .
docker run -p 3000:3000 donationalert
```

## Kubernetes
The `k8s/deployment.yaml` file provides a minimal deployment. Adjust the
`image` field to match your built image and apply it with `kubectl apply -f k8s/deployment.yaml`.

Due to environment limitations in this repository, dependencies are not
preinstalled. Ensure you run `npm install` before starting the server.
