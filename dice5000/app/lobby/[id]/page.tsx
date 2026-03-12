"use client";

import { useAuthState } from "@/app/components/useAuthState";
import { sendError } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { text } from "stream/consumers";






export default function LobbyPage() {
    const [chatMessage, setChatMessage] = useState("");
    const { user } = useAuthState();
    const { loading, isAuthenticated } = useAuthState();
    const router = useRouter();
    const [lobbyCode, setLobbyCode] = useState("");


    const MessageAdded = `
    subscription MessageAdded($lobbyId: ID!) {
        messageAdded(lobbyId: $lobbyId) {
            id
            text
            sender
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

    async function handleChatKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            const text = chatMessage;
            setChatMessage("");

            await fetch("http://localhost:4000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: sendMessage,
                    variables: {
                        lobbyId: lobbyCode,
                        text: text,
                        sender: user?.email
                    }
                })
            });
            
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
                <div className="w-full h-1/2 bg-gray-300 rounded">
                    <h1>TEST</h1>


                </div>
                <div className="w-full h-1/2 bg-gray-500 rounded flex flex-col mt-auto justify-end">
                    <p>[{chatMessage}]</p>
                    <input type="text" placeholder="chat" className="w-full rounded p-2" id="chatbox" value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={handleChatKey} />
                </div>




            </div>
        </div>
    );
}