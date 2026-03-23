"use client";

import Nav from "@/app/components/nav";
import { useAuthState } from "@/app/components/useAuthState";
import { useEffect, useRef, useState } from "react";

import { subscribeToMessages, listenToGameState, listenToDiceState } from "@/app/services/subscriptions.service";
import { fetchLobby, fetchUserByEmail, rollLobbyDice, sendLobbyMessage, startGame, bankTurn, closeLobby, incrementWins } from "@/app/services/api.service";
import { GameState, Message, User } from "@/app/services/types";
import { useRouter, useParams } from "next/navigation";







const DIE_FACE_IMAGES = [
    "/images/dice-six-faces-one.png",
    "/images/dice-six-faces-two.png",
    "/images/dice-six-faces-three.png",
    "/images/dice-six-faces-four.png",
    "/images/dice-six-faces-five.png",
    "/images/dice-six-faces-six.png",
];

function appendUniqueMessage(previous: Message[], incoming: Message): Message[] {
    return previous.some((existing) => existing.id === incoming.id) ? previous : [...previous, incoming];
}



export default function LobbyPage() {
    const [diceSelected, setDiceSelected] = useState<boolean[]>([false, false, false, false, false, false]);
    const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1, 1, 1]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [userData, setUserData] = useState<User | null>(null);
    const [players, setPlayers] = useState<User[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [rollsLeft, setRollsLeft] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const { user } = useAuthState();
    const { isAuthenticated } = useAuthState();
    const params = useParams<{ id: string }>();
    const lobbyCode = params?.id ?? "";
    const router = useRouter();


    const messagesEndRef = useRef<HTMLDivElement>(null);
    const finalRoundAlertShown = useRef(false);
    const gameOverAlertShown = useRef(false);

    const currentPlayerEmail = gameState?.currentPlayer?.email ?? null;
    const myEmail = user?.email ?? userData?.email ?? null;
    const isCurrentPlayersTurn = Boolean(currentPlayerEmail && myEmail && currentPlayerEmail === myEmail);

    const toggleDie = (index: number) => {
        if (!isCurrentPlayersTurn) return;
        setDiceSelected((previous) => previous.map((selected, i) => (i === index ? !selected : selected)));
    };

    async function rollDice() {
        if (!lobbyCode || !isCurrentPlayersTurn) return;


        const playerEmail = userData?.email ?? user?.email;
        if (!playerEmail) return;

        let diceToRoll = diceSelected
            .map((selected, index) => (selected ? -1 : index))
            .filter((index) => index >= 0);


        if (diceToRoll.length === 0) {

            diceToRoll = [0, 1, 2, 3, 4, 5];
        }



        if (gameState?.lastTurn && rollsLeft <= 0) {
            return;
        }

        try {
            await rollLobbyDice(lobbyCode, playerEmail, diceToRoll, diceSelected);
            setDiceSelected([false, false, false, false, false, false]);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleBank() {
        if (!lobbyCode || !isCurrentPlayersTurn) return;

        const playerEmail = userData?.email ?? user?.email;

        if (!playerEmail) return;

        try {
            await bankTurn(lobbyCode, playerEmail, gameState?.currentTurnScore ?? 0);
            setDiceSelected([false, false, false, false, false, false]);
            if (gameState?.lastTurn && rollsLeft >= 0) {
                setRollsLeft((prev) => prev - 1);
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        setDiceSelected([false, false, false, false, false, false]);

    }, [gameState?.currentPlayer?.uid]);



    useEffect(() => {
        if (!lobbyCode) return;

        const loadLobby = async () => {
            try {
                const lobby = await fetchLobby(lobbyCode);
                if (!lobby) {
                    router.push("/");
                    return;
                }
                setPlayers(lobby?.players ?? []);
                setRollsLeft(lobby?.players?.length ?? 0);
                await startGame(lobbyCode);
            } catch (error) {
                console.error(error);
            }
        };

        loadLobby();
    }, [lobbyCode, router]);

    useEffect(() => {
        if (!lobbyCode) return;

        const unsubscribe = listenToGameState(lobbyCode, (state) => {
            setGameState(state);
            setPlayers(state.players);
            setDiceValues(state.dice);
        });

        return () => unsubscribe();
    }, [lobbyCode]);


    useEffect(() => {
        if (!gameState?.lastTurn || finalRoundAlertShown.current) return;
        finalRoundAlertShown.current = true;
        alert("Final round! Everyone gets one last turn!");
    }, [gameState?.lastTurn]);

    useEffect(() => {
        if (!gameState?.lastTurn || rollsLeft > 0 || gameOver || gameOverAlertShown.current) return;
        gameOverAlertShown.current = true;
        alert("Game Over!");
        incrementWins(gameState.players[0].email ?? "");

        setGameOver(true);
    }, [gameState?.lastTurn, rollsLeft, gameOver]);

    useEffect(() => {
        finalRoundAlertShown.current = false;
        gameOverAlertShown.current = false;
    }, [lobbyCode]);

    useEffect(() => {
        if (!lobbyCode) return;

        const unsubscribe = listenToDiceState(lobbyCode, (diceSelected) => {
            setDiceSelected(diceSelected);
        });

        return () => unsubscribe();
    }, [lobbyCode]);

    useEffect(() => {
        const email = user?.email;

        if (!email) {
            setUserData(null);
            return;
        }

        const loadUser = async () => {
            try {
                const loadedUser = await fetchUserByEmail(email);
                setUserData(loadedUser);
            } catch (error) {
                console.error(error);
            }
        };

        loadUser();
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);



    useEffect(() => {
        if (!lobbyCode) return;

        const unsubscribe = subscribeToMessages(lobbyCode, (msg) => {
            setMessages((previous) => appendUniqueMessage(previous, msg));
        });

        return () => unsubscribe();
    }, [lobbyCode]);

    useEffect(() => {
        if (!gameOver || !lobbyCode) return;

        const playerEmail = userData?.email ?? user?.email;
        if (!playerEmail) return;

        (async () => {
            try {

                if (playerEmail === gameState?.players?.[0]?.email) {
                    await closeLobby(lobbyCode, playerEmail);
                }
            } finally {
                router.push("/");
            }
        })();
    }, [gameOver, lobbyCode, userData?.email, user?.email, gameState?.players, router]);

    async function handleChatKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== "Enter") return;

        const text = chatMessage.trim();
        if (!text) return;
        setChatMessage("");

        try {
            await sendLobbyMessage(lobbyCode, text, userData?.displayName ?? user?.email ?? "Unknown");
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="flex w-full h-full overflow-hidden bg-green-800">
            <div className="flex w-full h-full flex-col flex-1 ">
                <div className="bg-[radial-gradient(circle,#009107,#009107,#166534)] w-full h-full overflow-hidden rounded">
                    <h1 className="text-center text-2xl font-bold text-white p-5 w-full">
                        Lobby Code: {lobbyCode}
                    </h1>

                    <div className="flex flex-row p-1 gap-2 items-center justify-center m-30">
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                            const faceValue = diceValues[index] ?? 1;
                            const faceIndex = Math.max(0, Math.min(5, faceValue - 1));
                            const isSelected = diceSelected[index];

                            return (
                                <button
                                    key={index}
                                    id={`die${index + 1}`}
                                    className={`w-1/9 h-1/9 transition disabled:cursor-not-allowed disabled:[&>img]:grayscale disabled:[&>img]:opacity-40 ${isSelected ? "ring-4 ring-yellow-300 rounded-lg scale-105" : ""}`}
                                    onClick={() => toggleDie(index)}
                                    disabled={!isCurrentPlayersTurn}
                                    aria-pressed={isSelected}
                                >
                                    <img src={DIE_FACE_IMAGES[faceIndex]} alt={`Die face ${faceValue}`} />
                                </button>
                            );
                        })}
                    </div>

                    <div>
                        {gameState?.currentTurnScore !== undefined && (
                            <h2 className="text-center text-xl font-bold text-white mb-5">
                                Current Turn Score: {gameState.currentTurnScore}
                            </h2>
                        )}
                    </div>

                    <div className="flex items-center justify-center w-full gap-2">
                        <button
                            onClick={rollDice}
                            className="flex p-2 w-50 border-black justify-center items-center border-1 rounded bg-[radial-gradient(circle,#E84141,#E84141,#CF1717)] hover:bg-[radial-gradient(circle,#ff7269,#ff7269,#fa584d)] text-xl"
                            disabled={!isCurrentPlayersTurn}
                        >
                            ROLL
                        </button>
                        <button
                            onClick={handleBank}
                            className="flex p-2 w-50 border-black justify-center items-center border-1 rounded bg-[radial-gradient(circle,#E8E841,#E8E841,#CFCF17)] hover:bg-[radial-gradient(circle,#FDE68A,#FDE68A,#FCD34D)] text-xl"
                        >
                            BANK
                        </button>
                    </div>
                </div>

                <div className="flex flex-row bg-gray-300 w-full p-1 gap-2">
                    <div style={{ background: players[0]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">{players[0]?.displayName ?? "User 1"}</h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">{gameState?.scores?.[0] ?? 0}</h1>
                        </div>
                    </div>

                    <div style={{ background: players[1]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">{players[1]?.displayName ?? "User 2"}</h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">{gameState?.scores?.[1] ?? 0}</h1>
                        </div>
                    </div>

                    <div style={{ background: players[2]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">{players[2]?.displayName ?? "User 3"}</h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">{gameState?.scores?.[2] ?? 0}</h1>
                        </div>
                    </div>

                    <div style={{ background: players[3]?.prefcol ?? "white" }} className="flex1 p-2 border rounded h-65 w-full mb-5 items-center justify-center ">
                        <h1 className="text-center font-bold text-lg">{players[3]?.displayName ?? "User 4"}</h1>
                        <div className="w-full h-3/4 items-center justify-center flex">
                            <h1 className="text-6xl font-bold">{gameState?.scores?.[3] ?? 0}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-300 w-3/10 h-full overflow-hidden flex flex-col">
                <Nav></Nav>
                <div className="flex-1 w-full bg-gray-300 flex flex-col justify-end min-h-0">
                    <div className="p-2 overflow-y-auto flex-1 min-h-0 ">
                        {messages.map((m) => (
                            <p key={m.id}>
                                <strong style={{ color: players.find((p) => p.displayName === m.sender)?.prefcol ?? "white" }}>
                                    {m.sender}:
                                </strong>
                                {m.text}
                            </p>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="border rounded mb-7 m-3 ">
                        <input
                            type="text"
                            placeholder="chat"
                            className="w-full rounded p-3 "
                            id="chatbox"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.currentTarget.value)}
                            onKeyDown={handleChatKey}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
