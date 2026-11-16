import {

  Space_Grotesk,

  Orbitron,

  JetBrains_Mono,

  Noto_Sans,

  Bebas_Neue,

  Alfa_Slab_One,

  Anton,

  Rubik_Mono_One,

  Cinzel,

  Cinzel_Decorative,

} from "next/font/google";

import Navbar from "./components/Navbar";

import Footer from "./components/Footer";

import CursorTrialWrapper from "./components/CursorTrialWrapper";
import PhoenixPet from "./components/PhoenixPet";
import LavaEruption from "./components/LavaEruption";

import ProfileCompletionModal from "./components/ProfileCompletionModal";

import GlobalMealDayModal from "./components/GlobalMealDayModal";

import TeamNudgeWidget from "./components/TeamNudgeWidget";

import NetworkStatusToast from "./components/NetworkStatusToast";

import CartToast from "./components/CartToast";

import FetchTracker from "./components/FetchTracker";
import DeferredExternalFonts from "./components/DeferredExternalFonts";

import { AuthProvider } from "./context/AuthContext";

import { ProfileProvider } from "./context/ProfileContext";

import { CartProvider } from "./context/CartContext";

import { MusicProvider } from "./context/MusicContext";

import "./globals.css";



const spaceGrotesk = Space_Grotesk({

  subsets: ["latin"],

  variable: "--font-body",

  display: "swap",

});



const orbitron = Orbitron({

  weight: ["400", "500", "600", "700", "800", "900"],

  subsets: ["latin"],

  variable: "--font-display",

  display: "swap",

});



const jetbrainsMono = JetBrains_Mono({

  subsets: ["latin"],

  variable: "--font-mono",

  display: "swap",

});



// Events pages typography: Noto Sans / Bebas Neue for descriptions and body

// copy, Alfa Slab One / Anton for headings, Rubik Mono One for the event

// name on the detail page.

const notoSans = Noto_Sans({

  subsets: ["latin"],

  variable: "--font-noto",

  display: "swap",

});



const bebasNeue = Bebas_Neue({

  weight: "400",

  subsets: ["latin"],

  variable: "--font-bebas",

  display: "swap",

});



const alfaSlabOne = Alfa_Slab_One({

  weight: "400",

  subsets: ["latin"],

  variable: "--font-alfa",

  display: "swap",

});



const anton = Anton({

  weight: "400",

  subsets: ["latin"],

  variable: "--font-anton",

  display: "swap",

});



const rubikMonoOne = Rubik_Mono_One({

  weight: "400",

  subsets: ["latin"],

  variable: "--font-rubikmono",

  display: "swap",

});



const cinzel = Cinzel({

  weight: ["600", "700", "800"],

  subsets: ["latin"],

  variable: "--font-cinzel",

  display: "swap",

});



const cinzelDecorative = Cinzel_Decorative({

  weight: ["400", "700", "900"],

  subsets: ["latin"],

  variable: "--font-cinzel-decorative",

  display: "swap",

});



export const metadata = {

  title: "Dhanak 2027 - Ember from Ashes | IIST",

  description: "Dhanak 2027 - The Annual Cultural Festival of IIST Thiruvananthapuram.",

  icons: {
    icon: [
      { url: '/assets/dhanak-logo.png?v=2027', type: 'image/png', sizes: '512x512' },
      { url: '/icon.png?v=2027', type: 'image/png' },
      { url: '/favicon.ico?v=2027', sizes: 'any' },
    ],
    shortcut: '/assets/dhanak-logo.png?v=2027',
    apple: '/apple-icon.png?v=2027',
  },

}



export const viewport = {

  width: 'device-width',

  initialScale: 1,

  // Extend under the iPhone notch / Dynamic Island; content is padded back
  // in with env(safe-area-inset-*) in globals.css.
  viewportFit: 'cover',

  // Colours the Android Chrome address bar and iOS Safari status area.
  themeColor: '#0C0A09',

}



export default function RootLayout({ children }) {

  return (

    <html

      lang="en"

      className={`${spaceGrotesk.variable} ${orbitron.variable} ${jetbrainsMono.variable} ${notoSans.variable} ${bebasNeue.variable} ${alfaSlabOne.variable} ${anton.variable} ${rubikMonoOne.variable} ${cinzel.variable} ${cinzelDecorative.variable}`}

    >

      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" crossOrigin="anonymous" />

        <noscript>
          <link href="https://fonts.cdnfonts.com/css/black-mustang" rel="stylesheet" />
          <link href="https://fonts.cdnfonts.com/css/bad-coma" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap" rel="stylesheet" />
          <link
            href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700;800&family=Google+Sans:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        </noscript>

        {/* Official Dhanak 2027 Festival Browser Tab Favicons (cache-busted to immediately override browser cache) */}
        <link rel="icon" type="image/png" sizes="512x512" href="/assets/dhanak-logo.png?v=2027" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/dhanak-logo.png?v=2027" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/dhanak-logo.png?v=2027" />
        <link rel="icon" href="/favicon.ico?v=2027" sizes="any" />
        <link rel="shortcut icon" href="/assets/dhanak-logo.png?v=2027" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=2027" />
      </head>

      <body className="min-h-dvh text-white antialiased">

        <AuthProvider>

          <ProfileProvider>

            <CartProvider>

              <MusicProvider>

                <CursorTrialWrapper />
                <PhoenixPet />
                <LavaEruption />

                <ProfileCompletionModal />

                <GlobalMealDayModal />

                <TeamNudgeWidget />

                <NetworkStatusToast />

                <CartToast />

                <DeferredExternalFonts />

                <FetchTracker />

                <Navbar />

                <main className="relative min-h-0">{children}</main>

                <Footer />

              </MusicProvider>

            </CartProvider>

          </ProfileProvider>

        </AuthProvider>

      </body>

    </html>

  )

}

