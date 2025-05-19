# BeeSim: Endless Fields & Trees

![BeeSim Screenshot](https://github.com/ShaharFullStack/BeeDay/blob/main/assets/images/homePageBackground.png?raw=true)

## 🐝 [Play the Game!](https://shaharfullstack.github.io/BeeDay/)

BeeSim is a relaxing 3D web-based game where you play as a bee flying through beautiful low-poly landscapes. Collect nectar from flowers and return it to your hive to make honey.

## ✨ Features

- Beautiful low-poly aesthetic with cherry blossom trees and colorful flowers
- Endless procedurally generated world that expands as you explore
- Nectar collection and honey production gameplay
- Smooth flight controls for both desktop and mobile devices
- Dynamic day/night cycle (coming soon)

## 🎮 Controls

### Desktop:
- **Mouse**: Look around
- **WASD**: Move in different directions
- **R/F** or **Mouse Wheel**: Adjust height
- **Left Click** or **Space**: Collect nectar / Deposit honey
- **Shift**: Move faster

### Mobile:
- **Left Joystick**: Look around
- **Right Joystick**: Move
- **Up/Down Buttons**: Adjust height
- **Action Button**: Collect nectar / Deposit honey

## 🔧 Technologies

- Three.js for 3D rendering
- JavaScript ES6
- HTML5 & CSS3
- Hammer.js for mobile touch controls

## 💻 Development

Clone the repository and open `index.html` in your browser to play locally.

```bash
git clone https://github.com/ShaharFullStack/BeeDay.git
cd BeeDay
```

## 🔐 Setting Up Google Authentication

To enable the Google Sign-In feature:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your development and production domains to "Authorized JavaScript origins"
   - For local development, add: `http://localhost:5500`, `http://127.0.0.1:5500`, etc.
   - For production, add your actual domain
7. Click "Create" to generate your Client ID
8. Copy the generated Client ID and replace the `CLIENT_ID` value in `js/auth.js`

```javascript
const CLIENT_ID = "YOUR_CLIENT_ID_HERE";
```

> **Note:** Without proper Google OAuth configuration, the Google Sign-In button will fall back to guest login mode.

## 🙏 Credits

Created with ❤️ by ShaharFullStack. Inspired by the beauty of nature and the importance of bees in our ecosystem.