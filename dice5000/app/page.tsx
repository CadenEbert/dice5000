"use client";

import Test from "./components/GetUsers";
import Form from "./components/Form";
import { useAuthState } from "./components/useAuthState";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuthState();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in.</div>;

  return (
    <>
      <div>Welcome {user?.email}</div>

      <div className="flex h-[calc(100vh-60px)] overflow-hidden">
        <div className="flex flex-col flex-1">
          <div className="bg-green-500 w-350 h-150 overflow-hidden">
            <h1>box1</h1>
            <Form />
          </div>

          <div className="flex-1 bg-blue-500 h-full">
            <h1>whats goods</h1>
            <Test />
          </div>
        </div>

        <div className="bg-white-500 w-250 h-full overflow-hidden flex-1 flex items-center justify-center">
          <div className="flex flex-col space-x-8 p-20 border bg-yellow-50">
            <div className="flex-row">
              <p>Input Lobby Code: </p>
              <input type="text" placeholder="Enter Code" className="bg-white-500 border" />
            </div>

            <div className="space-x-6 flex-row">
              <button className="hover:bg-gray-500">Create Game</button>
              <button className="hover:bg-gray-500">Join Game</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}