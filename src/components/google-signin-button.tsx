// "use client";
// import { useRef, useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useGoogleSignIn } from "@/lib/hooks/use-google-signin";

// interface GoogleSignInButtonProps {
//   onSuccess?: (user: any) => void;
//   onError?: (error: Error) => void;
//   className?: string;
//   text?: string;
//   theme?: 'outline' | 'filled_blue' | 'filled_black';
// }

// export default function GoogleSignInButton({
//   onSuccess,
//   onError,
//   className = "",
//   text = "Sign in with Google",
//   theme = 'outline',
// }: GoogleSignInButtonProps) {
//   const buttonRef = useRef<HTMLDivElement>(null);
//   const router = useRouter();
//   const [isButtonRendered, setIsButtonRendered] = useState(false);
//   const { renderButton, signIn, isLoading, error, isInitialized } = useGoogleSignIn({
//     onSuccess: (user) => {
//       onSuccess?.(user);
//       router.push("/dashboard");
//     },
//     onError: (error) => {
//       onError?.(error);
//       console.error("Google Sign-In error:", error);
//     },
//   });

//   // Render the Google Sign-In button once the SDK is loaded
//   useEffect(() => {
//     if (isInitialized && buttonRef.current && !isButtonRendered) {
//       try {
//         renderButton(buttonRef.current, {
//           text: text === "Continue with Google" ? "continue_with" : "signin_with",
//           theme,
//         });
//         setIsButtonRendered(true);
//       } catch (err) {
//         console.error("Failed to render Google button:", err);
//       }
//     }
//   }, [isInitialized, renderButton, isButtonRendered, text, theme]);

//   // If Google client ID is missing or there's an error, show custom button
//   if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || error) {
//     return (
//       <button
//         type="button"
//         onClick={async () => {
//           try {
//             await signIn();
//           } catch (err) {
//             console.error("Manual Google sign-in failed:", err);
//           }
//         }}
//         disabled={isLoading}
//         className={`flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60 ${className}`}
//       >
//         <svg className="w-5 h-5" viewBox="0 0 24 24">
//           <path
//             fill="currentColor"
//             d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
//           />
//         </svg>
//         {text}
//       </button>
//     );
//   }

//   // Show loading state while initializing
//   if (isLoading) {
//     return (
//       <button
//         disabled
//         className={`flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-500 ${className}`}
//       >
//         <div className="w-5 h-5 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
//         Loading...
//       </button>
//     );
//   }

//   // This div will be replaced by the Google Sign-In button
//   return <div ref={buttonRef} className={className}></div>;
// }
