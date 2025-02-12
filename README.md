# Guest Management System

## Overview

The Guest Management System is a web application designed to manage guests and dormitories. It allows users to log in using Google authentication, manage guest information, assign guests to dorms, and view updates made by users.

## Features

- Google Authentication
- Guest Management
- Dorm Management
- User Updates
- Role-based Access Control

## Technologies Used

- React
- Firebase (Authentication, Firestore)
- React Router
- CSS for styling

## Getting Started

### Prerequisites

- Node.js
- Firebase account

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/guest-management.git
   cd guest-management
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your Firebase configuration:

   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

4. Start the development server:
   ```sh
   npm start
   ```

## Usage

- Navigate to the application in your browser.
- Log in using Google authentication.
- Manage guests and dormitories based on your role (admin or staff).
- View updates made by users.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.
