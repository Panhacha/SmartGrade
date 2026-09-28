echo "Starting Smart Grade Entry Database..."
docker-compose up -d

echo "Starting Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"

echo "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
