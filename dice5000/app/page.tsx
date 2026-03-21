"use client";

import { useAuthState } from "./components/useAuthState";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "./components/nav";

export default function Home() {
  const { user } = useAuthState();
  const { loading, isAuthenticated } = useAuthState();
  const router = useRouter();
  const [lobbyCode, setLobbyCode] = useState("");
  const url = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  const createLobby = `
    mutation CreateLobby($hostEmail: String!) {
      createLobby(hostEmail: $hostEmail) {
        id
        players {
          email
        }
      }
    }
  `;

  const joinLobby = `
    mutation JoinLobby($lobbyId: ID!, $playerEmail: String!) {
      joinLobby(lobbyId: $lobbyId, playerEmail: $playerEmail) {
        id
        players {
          email
        }
      }
    }
  `;

  async function createLobbyFunc() {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: createLobby,
        variables: {
          hostEmail: user?.email
        }
      })
    });

    const result = await response.json();
    const lobbyId = result.data.createLobby.id;

    router.push(`/lobby/${lobbyId}`);
  }

  async function joinLobbyFunc() {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: joinLobby,
        variables: {
          lobbyId: lobbyCode,
          playerEmail: user?.email
        }
      })
    });

    const result = await response.json();

    const joinedLobbyId = result?.data?.joinLobby?.id;

    if (joinedLobbyId) {
      router.push(`/lobby/${joinedLobbyId}`);
    }
  }



  return (




   

      <div className="bg-gray-700   w-full h-full overflow-hidden  ">
        <Nav></Nav>

        <div className="flex items-center justify-center w-full h-full">
          <div className="flex flex-col space-x-6 p-20 mb-30 border bg-yellow-50 items-center justify-center">
            <div className="flex-row">
              <p>Input Lobby Code: </p>
              <input type="text" placeholder="Enter Code" value={lobbyCode} onChange={(e) => setLobbyCode(e.target.value)} className="bg-white-500 border rounded p-2" />
            </div>

            <div className="w-full flex items-center justify-center  p-3 gap-3">
              <button id="host-game" onClick={createLobbyFunc} className="bg-blue-300 hover:bg-blue-500 p-2 rounded flex-1 whitespace-nowrap">Host Game</button>
              <button id="join-game" onClick={joinLobbyFunc} className="bg-green-300 hover:bg-green-500 p-2 rounded flex-1 whitespace-nowrap">Join Game</button>
            </div>
          </div>

        </div>

      </div>
    

  );
}