"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(() => { router.push("/");});
  const signInWithGithub = () => signInWithPopup(auth, new GithubAuthProvider()).then(() => { router.push("/");});
  const signInWithEmail = () => signInWithEmailAndPassword(auth, email, password).then(() => { router.push("/");});

  return (
    <div className="flex items-center justify-center h-screen bg-gray-700">

    <div className=" items-center justify-center border bg-gray-100 p-5 w-96 rounded-lg shadow-lg">
        <div className="flex flex-col items-center border-b mb-4 pb-4 border-gray-400">
        <h1 className="text-2xl mb-4">Sign In</h1>
        </div>
        
        <div className="flex-1 flex items-center  mb-4 p-6 flex-col">
            
            <div className="bg-white flex items-center justify-center w-full h-full mb-4 border hover:bg-gray-300 rounded p-2 text-xl ">
            <button onClick={signInWithGoogle}>Sign in with Google</button>
            </div>
            <div className="bg-white flex items-center justify-center w-full h-full mb-4 border text-xl hover:bg-gray-300 rounded p-2 ">
            <button onClick={signInWithGithub}>Sign in with GitHub</button>
            </div>

        <div className="flex flex-col items-center justify-center w-full h-full mb-4 border rounded p-5 mb-2 gap-2">
            <p className="text-lg  mb-2">Or Sign-in with Email:</p>
            <input className="border rounded p-3 mb-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="border rounded p-3 mb-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="bg-blue-500 text-white p-3 px-4 rounded hover:bg-blue-600" onClick={signInWithEmail}>
                Sign in with Email
            </button>
        </div>  
        
   



        

      </div>


    </div>
    </div>


   
  );
}