import { useEffect, useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function AuthToggleButton() {
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);

  // Watch for sign-in/sign-out state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("✅ Signed in with Google");
    } catch (error) {
      console.error("❌ Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("✅ Signed out");
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  return (
    <button
      onClick={user ? handleSignOut : handleGoogleSignIn}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "5px",
        backgroundColor: user ? "#dc2626" : "#2563eb",
        color: "white",
        border: "none",
        cursor: "pointer",
      }}
    >
      {user ? "Sign Out" : "Sign in with Google"}
    </button>
  );
}
