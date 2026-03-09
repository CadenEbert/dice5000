"use client";


import { useAuthState } from "./components/useAuthState";
import Nav from "./components/nav";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function Home() {
  const { user, loading, isAuthenticated } = useAuthState();
  const router = useRouter();

  


  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return useEffect(() => {
    router.push("/login"); 
  }, [router]);;

  return (
    <>
      <Nav></Nav>
      

      <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-green-800">

        <div className="flex flex-col flex-1">
        <div className="bg-[radial-gradient(circle,#009107,#009107,#166534)] w-250 h-full overflow-hidden rounded"> 
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

          <div className="flex items-center justify-center w-full h-full">
            <button className="flex p-2 w-50 border rounded bg-[radial-gradient(circle,#E8E841,#E8E841,#CFCF17)] hover:bg-yellow-200  text-xl">ROLL</button>
          </div>
            
            
        </div>

          <div className="flex flex-row  bg-gray-200 p-1 gap-2">

            <div className="flex1 p-2 border rounded h-65 w-full bg-white mb-5 items-center justify-center ">
              <h1 className="text-center font-bold text-lg">
                User 1
              </h1>
              <p>Score</p>

            </div>

            <div className="flex1 p-2  border rounded h-65 w-full bg-white mb-5 items-center justify-center ">
              <h1 className="text-center font-bold text-lg">
                User 2
              </h1>
              <p>Score</p>

            </div>

            <div className="flex1 p-2 border rounded h-65 w-full bg-white mb-5 items-center justify-center ">
              <h1 className="text-center font-bold text-lg">
                User 3
              </h1>
              <p>Score</p>

            </div>

            <div className="flex1 p-2 border rounded h-65 w-full bg-white mb-5 items-center justify-center ">
              <h1 className="text-center font-bold text-lg">
                User 4
              </h1>
              <p>Score</p>

            </div>
            
           
          </div>
        </div>

        <div className="bg-white w-250 h-full overflow-hidden flex-1 flex items-center justify-center">
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