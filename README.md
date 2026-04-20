# Explore Unity 🌍

**Explore Unity** is a premium social travel platform designed for modern adventurers. It empowers travelers to document their journeys, share immersive travel journals, and connect with a global community of explorers. Whether you're planning your next big adventure or looking to join someone else's trip, Explore Unity is your ultimate travel companion.



## 🚀 Key Features

-   **Community Feed**: Discover breathtaking journeys from travelers worldwide in a sleek, interactive feed.
-   **Travel Journaling**: Create beautiful, media-rich journals of your trips, complete with destinations, dates, and stories.
-   **Trip Planning & Joining**: Plan detailed itineraries and open them for the community to join, or request to join upcoming trips led by other travelers.
-   **Social Interaction**: Follow your favorite explorers, like their journals, and engage through real-time comments.
-   **Personalized Profiles**: Showcase your travel history, pending trips, and social connections in a professional traveler profile.
-   **Real-time Notifications**: Stay in the loop with instant updates on social interactions and trip requests.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Frontend**: [React 18](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Backend & Auth**: [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore)
-   **Media Storage**: [Cloudinary](https://cloudinary.com/)
-   **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

## 📂 Project Structure

```text
├── app/               # Next.js App Router (Pages, API Routes, Global Styles)
├── components/        # Reusable UI Components (Shared, Home, Trip, User, etc.)
├── helpers/           # Utility functions and helper methods
├── hooks/             # Custom React Hooks for shared logic
├── public/            # Static assets (images, icons, etc.)
├── store/             # Global state management configuration
├── types/             # TypeScript interfaces and type definitions
├── utils/             # External service configurations (Firebase, etc.)
└── package.json       # Project dependencies and scripts
```

## 🚦 Getting Started

### Prerequisites

-   **Node.js**: v18.x or higher
-   **Package Manager**: `npm` or `bun`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/GauravJawalkar/explore-unity.git
    cd explore-unity
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Set up environment variables**:
    Create a `.env` file in the root directory and add your credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
