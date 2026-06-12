import { useState } from "react";
import { TbMail, TbLock, TbUser } from "react-icons/tb";
import { VscRobot } from "react-icons/vsc";
import { FcGoogle } from "react-icons/fc"; // Imported for the Google Button branding
import { auth, googleProvider } from "../firebase"; // Imported googleProvider here
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile 
} from "firebase/auth";

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Traditional Form Submit Handling (Email/Password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill out all fields.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err) {
      handleAuthErrors(err);
    } finally {
      setLoading(false);
    }
  };

  // Google Authentication Handler
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (err) {
      // Don't flag error text if the user closes the pop-up modal manually
      if (err.code !== "auth/popup-closed-by-user") {
        handleAuthErrors(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Centralized Firebase Error Formatting
  const handleAuthErrors = (err) => {
    switch (err.code) {
      case "auth/email-already-in-use":
        setError("This email address is already registered.");
        break;
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        setError("Invalid email or password combination.");
        break;
      case "auth/weak-password":
        setError("Password must be at least 6 characters long.");
        break;
      default:
        setError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a0e] text-slate-100 font-sans p-4 antialiased selection:bg-cyan-500/30">
      
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/3 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/3 blur-[120px]" />
      </div>

      {/* Auth Card Box */}
      <div className="w-full max-w-md bg-[#090d14] border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Logo and Brand Header Row */}
        <div className="flex flex-col items-center text-center mb-7 select-none">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 text-cyan-400 flex items-center justify-center shadow-inner mb-4">
            <VscRobot className={`w-7 h-7 ${loading ? "animate-pulse" : "animate-pulse"}`} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white/90">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {isSignUp ? "Get started with Edith Study Assistant" : "Log in to continue your workspace sessions"}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl text-center">
            {error}
          </div>
        )}

        {/* GOOGLE FEDERATED SIGN-IN TRIGGER */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full bg-[#131722] border border-white/5 text-slate-200 hover:text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-white/5 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <FcGoogle className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        {/* BREAKING VISUAL OR-DIVIDER SPLIT */}
        <div className="flex items-center my-6 select-none">
          <div className="flex-1 border-t border-white/5"></div>
          <span className="px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Or</span>
          <div className="flex-1 border-t border-white/5"></div>
        </div>

        {/* INPUT INTERACTIVE FORM STREAM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Conditional Name Field (Only for Sign Up Mode) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 pl-1">Full Name</label>
              <div className="relative flex items-center bg-[#131722] border border-white/6 focus-within:border-cyan-500/40 focus-within:ring-4 focus-within:ring-cyan-500/3 rounded-xl transition-all duration-200">
                <TbUser className="w-4 h-4 text-slate-500 ml-3.5 absolute pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full Name"
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent outline-none pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 font-normal disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Core Email Input Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 pl-1">Email Address</label>
            <div className="relative flex items-center bg-[#131722] border border-white/6 focus-within:border-cyan-500/40 focus-within:ring-4 focus-within:ring-cyan-500/3 rounded-xl transition-all duration-200">
              <TbMail className="w-4 h-4 text-slate-500 ml-3.5 absolute pointer-events-none" />
              <input
                type="email"
                placeholder="Email Address"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 font-normal disabled:opacity-50"
              />
            </div>
          </div>

          {/* Core Password Input Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-medium text-slate-400">Password</label>
              {!isSignUp && (
                <a href="#forgot" className="text-[11px] text-cyan-400 hover:underline transition font-medium">
                  Forgot?
                </a>
              )}
            </div>
            <div className="relative flex items-center bg-[#131722] border border-white/6 focus-within:border-cyan-500/40 focus-within:ring-4 focus-within:ring-cyan-500/3 rounded-xl transition-all duration-200">
              <TbLock className="w-4 h-4 text-slate-500 ml-3.5 absolute pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 font-normal disabled:opacity-50"
              />
            </div>
          </div>

          {/* Main Action Form Execution Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-slate-950 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-200 active:scale-[0.99] transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50 disabled:hover:bg-white"
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Auth State Switch Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            disabled={loading}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-cyan-400 hover:underline font-semibold cursor-pointer ml-0.5 disabled:opacity-50"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}