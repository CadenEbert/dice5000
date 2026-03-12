"use client";

import { useAuthState } from "@/app/components/useAuthState";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/app/components/nav";

type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    wins: number | null;
    prefcol: string | null;
};

export default function Profile() {
    const [userData, setUserData] = useState<User | null>(null);
    const query = `
  query GetUserByEmail($email: String!) {
    userByEmail(email: $email) {
      uid
      email
      displayName
      wins
      prefcol
    }
  }
`;

    const { user, loading } = useAuthState();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user?.email) {
            fetchUserByEmail();
        }
    }, [user]);


    async function updateDisplayName() {
        const newName = document.getElementById("displayNameInput") as HTMLInputElement;
        if (!newName.value) return;
        if (newName.value.length >= 12) return;


    };


    async function updatePrefColor() {
        console.log("hi")
    };



    async function fetchUserByEmail() {
        const res = await fetch("https://us-central1-dice5000.cloudfunctions.net/graphqlApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables: {
                    email: user?.email,
                },
            }),
        });
        const { data, errors } = await res.json();

        setUserData(data.userByEmail);
        if (errors) {
            console.error(errors);
            return null;
        }
        if (!data.userByEmail) {
            console.error("User not found");
            return null;
        }
        return data.userByEmail;
    };


    return (
        <>
            <Nav></Nav>

            <div className="bg-gray-700  w-full h-full overflow-hidden items-center justify-center">

                <div className="bg-gray-800 rounded-lg p-6 mt-10 w-1/3 h-3/4 mx-auto">
                    <h1 className="text-2xl font-bold text-white mb-4 text-center border-b p-2">Profile</h1>
                    <p className="text-white text-lg font-bold">Display Name: {userData?.displayName}</p>
                    <p className="text-white text-lg font-bold">Email: {userData?.email}</p>
                    <p className="text-white text-lg font-bold">Wins: {userData?.wins}</p>
                    <p className="text-white text-lg font-bold">Preferred Color: {userData?.prefcol}</p>


                    


                    <div className="bg-gray-600 rounded-lg p-5 mt-4 h-6/10">
                        <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-2">Update Display Name</h2>
                        <input type="text" placeholder="New Display Name" className="text-white w-full p-2 rounded mb-2 border-black/50" id="displayNameInput" />
                        <button className="w-1/6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={updateDisplayName}>
                            Update
                        </button>

                        

                            <h3 className="text-xl font-bold text-white mb-2 py-4">Change Prefered Color</h3>
                            <select id="colors" className="w-3/4 bg-gray-500 text-white border border-gray-300 mb-2 ">
                                <option value="" disabled>Select Color</option>
                                <option>Red</option>
                                <option>Blue</option>
                                <option>Green</option>
                                <option>Yellow</option>
                                <option>Purple</option>
                                <option>Orange</option>
                            </select>
                            <button className="w-1/6 bg-blue-500 hover:bg-blue-700 text-white font-bold spacing-y-3 py-2 px-4 rounded" onClick={updatePrefColor}>
                                Update
                            </button>
                        </div>
                    </div>

                </div>




            </div>






        </>


    );
}