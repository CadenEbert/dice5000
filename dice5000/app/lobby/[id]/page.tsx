"use client";

import { useAuthState } from "@/app/components/useAuthState";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";



type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    wins: number | null;
    prefcol: string | null;
};





export default function LobbyPage() {
    const [messages, setMessages] = useState<{ id: string; text: string; sender: string }[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [userData, setUserData] = useState<User | null>(null);
    const [players, setPlayers] = useState<User[]>([]);



    const { user } = useAuthState();
    const params = useParams<{ id: string }>();
    const lobbyCode = params?.id ?? "";
    const graphqlUrl = "http://192.168.0.180:4000/graphql";

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


    const messagesEndRef = useRef<HTMLDivElement>(null);


    async function fetchUserByEmail() {
        const res = await fetch(graphqlUrl, {
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




    const lobbyQuery = `
        query GetLobby($id: ID!) {
        lobby(id: $id) {
            id
            host
            players {
                uid
                email
                displayName
                prefcol
                wins
            }
        }
    }
`;

    const sendMessage = `
        mutation SendMessage($lobbyId: ID!, $text: String!, $sender: String!) {
        sendMessage(lobbyId: $lobbyId, text: $text, sender: $sender) {
            id
            text
        }
    }
`;

    const getMessages = `
        query GetMessages($lobbyId: ID!) {
        getMessages(lobbyId: $lobbyId) {
            id
            text
            sender
        }
    }
`;

    async function fetchLobby() {
        const res = await fetch(graphqlUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: lobbyQuery,
                variables: {
                    id: lobbyCode,
                },
            }),
        });
        const { data, errors } = await res.json();
        if (errors) {
            console.error(errors);
            return null;
        }

        return data.lobby;
    }

    useEffect(() => {
        if (user?.email) fetchUserByEmail();
    }, [user]);

    useEffect(() => {
        if (!lobbyCode) return;

        const fetchPlayers = async () => {
            const lobby = await fetchLobby();
            if (lobby) setPlayers(lobby.players);
        };

        fetchPlayers(); 

        const interval = setInterval(fetchPlayers, 2000);

        return () => clearInterval(interval);
    }, [lobbyCode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!lobbyCode) return;


        const fetchMessages = async () => {
            const response = await fetch("http://192.168.0.180:4000/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `query { getMessages(lobbyId: "${lobbyCode}") { id text sender } }`
                }),
            });
            const result = await response.json();
            setMessages(result?.data?.getMessages ?? []);
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [lobbyCode]);

    async function handleChatKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            const text = chatMessage.trim();
            if (!text) return;
            setChatMessage("");

            const res = await fetch("http://192.168.0.180:4000/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `mutation { sendMessage(lobbyId: "${lobbyCode}", text: "${text}", sender: "${userData?.displayName}") { id text } }`
                }),
            });
            const result = await res.json();
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

                    <div style={{ background: players[0]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">
                            {players[0]?.displayName ?? "User 1"}
                        </h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">0</h1>

                        </div>

                    </div>

                    <div style={{ background: players[1]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">
                            {players[1]?.displayName ?? "User 2"}
                        </h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">0</h1>

                        </div>

                    </div>

                    <div style={{ background: players[2]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">
                            {players[2]?.displayName ?? "User 3"}
                        </h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">0</h1>

                        </div>

                    </div>

                    <div style={{ background: players[3]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">
                            {players[3]?.displayName ?? "User 4"}
                        </h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">0</h1>

                        </div>

                    </div>


                </div>
            </div>

            <div className="bg-gray-700   w-3/10 h-full overflow-hidden  ">
                <div className="w-full h-1/2 bg-gray-500 rounded flex flex-col justify-end min-h-0">
                    <div className="p-2 overflow-y-auto flex-1 min-h-0">
                        {messages.map((m) => (
                            <p key={m.id} >
                                <strong style={{ color: players.find(p => p.displayName === m.sender)?.prefcol ?? "white" }}>{m.sender}: </strong> {m.text}
                            </p>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <input
                        type="text"
                        placeholder="chat"
                        className="w-full rounded p-2"
                        id="chatbox"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.currentTarget.value)}
                        onKeyDown={handleChatKey}
                    />
                </div>




            </div>
        </div>
    );
}