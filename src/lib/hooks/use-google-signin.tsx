// "use client";
// import { useEffect, useState, useCallback } from "react";
// import authService from "@/lib/auth-service";

// // Define interface for Google global
// declare global {
//   interface Window {
//     google?: {
//       accounts: {
//         id: {
//           initialize: (config: any) => void;
//           renderButton: (element: HTMLElement, options: any) => void;
//           prompt: (moment?: any) => void;
//         };
//       };
//     };
//   }
// }

// interface UseGoogleSignInOptions {
//   clientId?: string;
//   onSuccess?: (user: any) => void;
//   onError?: (error: Error) => void;
// }

// export function useGoogleSignIn(options: UseGoogleSignInOptions = {}) {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//   const clientId = options.clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

//   useEffect(() => {
//     // Only run in browser
//     if (typeof window === 'undefined') return;
    
//     if (!clientId) {
//       setIsLoading(false);
//       setError(new Error("Google Client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file"));
//       return;
//     }

//     // Check if script is already loaded
//     const existingScript = document.getElementById("google-signin-script");
//     if (existingScript) {
//       setIsLoading(false);
//       if (window.google?.accounts) {
//         setIsInitialized(true);
//       }
//       return;
//     }

//     // Load Google Identity Services script
//     const script = document.createElement('script');
//     script.src = "https://accounts.google.com/gsi/client";
//     script.id = "google-signin-script";
//     script.async = true;
//     script.defer = true;
//     script.onload = () => {
//       setIsLoading(false);
//       if (window.google?.accounts) {
//         setIsInitialized(true);
//       } else {
//         setError(new Error("Google Identity Services failed to initialize"));
//       }
//     };
//     script.onerror = () => {
//       setIsLoading(false);
//       setError(new Error("Failed to load Google Sign-In"));
//     };
//     document.head.appendChild(script);

//     return () => {
//       // Don't remove the script to avoid issues with multiple components using this hook
//     };
//   }, [clientId]);
  
//   const initializeGoogleSignIn = useCallback(() => {
//     if (!window.google?.accounts || !clientId) {
//       return false;
//     }
    
//     try {
//       window.google.accounts.id.initialize({
//         client_id: clientId,
//         callback: async (response: any) => {
//           if (response.error) {
//             const error = new Error(response.error);
//             options.onError?.(error);
//             return;
//           }

//           try {
//             // Send the ID token to your backend
//             const idToken = response.credential;
//             const user = await authService.loginWithGoogle(idToken);
//             options.onSuccess?.(user);
//           } catch (error: any) {
//             options.onError?.(error);
//           }
//         },
//         auto_select: false,
//         cancel_on_tap_outside: true,
//       });
//       return true;
//     } catch (error: any) {
//       console.error("Error initializing Google Sign-In:", error);
//       options.onError?.(error);
//       return false;
//     }
//   }, [clientId, options]);

//   useEffect(() => {
//     if (isInitialized && !isLoading) {
//       initializeGoogleSignIn();
//     }
//   }, [isInitialized, isLoading, initializeGoogleSignIn]);

//   const signIn = async () => {
//     if (!window.google?.accounts) {
//       const error = new Error("Google Sign-In has not been initialized");
//       setError(error);
//       throw error;
//     }

//     try {
//       // Make sure Google Sign-In is initialized
//       if (!isInitialized) {
//         const initialized = initializeGoogleSignIn();
//         if (!initialized) {
//           throw new Error("Failed to initialize Google Sign-In");
//         }
//       }

//       // Display the One Tap UI
//       window.google.accounts.id.prompt();
//       return true;
//     } catch (error: any) {
//       setError(error);
//       options.onError?.(error);
//       throw error;
//     }
//   };

//   const renderButton = useCallback((element: HTMLElement, buttonOptions = {}) => {
//     if (!window.google?.accounts) {
//       setError(new Error("Google Sign-In has not been initialized"));
//       return;
//     }

//     if (!isInitialized) {
//       const initialized = initializeGoogleSignIn();
//       if (!initialized) {
//         return;
//       }
//     }

//     const defaultOptions = {
//       type: 'standard',
//       theme: 'outline',
//       size: 'large',
//       text: 'signin_with',
//       shape: 'rectangular',
//       logo_alignment: 'left',
//     };

//     try {
//       window.google.accounts.id.renderButton(
//         element,
//         { ...defaultOptions, ...buttonOptions }
//       );
//     } catch (error: any) {
//       console.error("Error rendering Google button:", error);
//     }
//   }, [isInitialized, initializeGoogleSignIn]);

//   return {
//     signIn,
//     renderButton,
//     isLoading,
//     isInitialized,
//     error,
//   };
// }
