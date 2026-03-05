"use client";

import { useState } from "react";
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider
} from "firebase/auth";
import app from "../lib/firebase";

const auth = getAuth(app);

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
  const signInWithGithub = () => signInWithPopup(auth, new GithubAuthProvider());
  const signInWithEmail = () => signInWithEmailAndPassword(auth, email, password);

  return (
    <div style={{ maxWidth: "320px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>My App</h1>
      <p>Please sign-in:</p>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
      <button onClick={signInWithGithub}>Sign in with GitHub</button>
      <p>Or sign-in with email:</p>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signInWithEmail}>Sign in with Email</button>
    </div>
  );
}