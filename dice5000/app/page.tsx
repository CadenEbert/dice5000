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
        players
      }
    }
  `;

  const joinLobby = `
    mutation JoinLobby($lobbyId: ID!, $playerEmail: String!) {
      joinLobby(lobbyId: $lobbyId, playerEmail: $playerEmail) {
        id
        players
      }
    }
  `;

  async function createLobbyFunc() {
    const response = await fetch("http://192.168.0.180:4000/graphql", {
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
    const response = await fetch("http://192.168.0.180:4000/graphql", {
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




    <div className="flex w-full h-full overflow-hidden bg-green-800">

      <div className="flex w-full h-full flex-col flex-1">
        <div className="bg-[radial-gradient(circle,#009107,#009107,#166534)] w-full h-full overflow-hidden rounded">
          <h1 className="text-center text-2xl font-bold text-white p-5 w-full">
            User1's Turn
          </h1>

          <div className="flex flex-row  p-1 gap-2 items-center justify-center">
            <p>A</p>
            <p>A</p>
            <p>A</p>
            <p>A</p>
            <p>A</p>

          </div>

          <div className="flex items-center justify-center w-full h-full gap-2">
            <button className=" flex p-2 w-50 border-black justify-center items-center border-1 rounded bg-[radial-gradient(circle,#E84141,#E84141,#CF1717)] hover:bg-[radial-gradient(circle,#ff7269,#ff7269,#fa584d)] text-xl">ROLL</button>
            <button className=" flex p-2 w-50 border-black justify-center items-center border-1 rounded bg-[radial-gradient(circle,#E8E841,#E8E841,#CFCF17)] hover:bg-[radial-gradient(circle,#FDE68A,#FDE68A,#FCD34D)] text-xl">BANK</button>

          </div>



        </div>

        <div className="flex flex-row  bg-gray-700 w-full p-1 gap-2">

          <div className="flex1 p-2 border rounded h-65 w-full bg-gray-300 mb-5 items-center justify-center ">
            <h1 className="text-center font-bold text-lg">
              User 1
            </h1>
            <p>Score</p>

          </div>

          <div className="flex1 p-2  border rounded h-65 w-full bg-gray-300 mb-5 items-center justify-center ">
            <h1 className="text-center font-bold text-lg">
              User 2
            </h1>
            <p>Score</p>

          </div>

          <div className="flex1 p-2 border rounded h-65 w-full bg-gray-300 mb-5 items-center justify-center ">
            <h1 className="text-center font-bold text-lg">
              User 3
            </h1>
            <p>Score</p>

          </div>

          <div className="flex1 p-2 border rounded h-65 w-full bg-gray-300 mb-5 items-center justify-center ">
            <h1 className="text-center font-bold text-lg">
              User 4
            </h1>
            <p>Score</p>

          </div>


        </div>
      </div>

      <div className="bg-gray-700   w-3/10 h-full overflow-hidden  ">
        <Nav></Nav>

        <div className="flex items-center justify-center w-full h-3/4">
          <div className="flex flex-col space-x-6 p-20 border bg-yellow-50 items-center justify-center">
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
    </div>

  );
}