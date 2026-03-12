import Link from "next/dist/client/link";
import { useRouter } from "next/navigation";

export default function Nav() {
    const router = useRouter();
    return (

      

        
        <nav className="w-full bg-gray-500 p-2 ">
          <ul className="flex flex-row gap-4 p-4 items-center justify-center">
            <button className="text-white text-xl font-bold hover:bg-gray-500 p-2 w-1/5 rounded cursor-pointer" onClick={() => router.push("/")}>Home</button>
            <button className="text-white text-xl font-bold hover:bg-gray-500 p-2 w-1/5 rounded cursor-pointer" onClick={() => router.push("/profile")}>Profile</button>
            <button className="text-white text-xl font-bold hover:bg-gray-500 p-2 w-1/5 rounded cursor-pointer" onClick={() => router.push("/settings")}>Settings</button>
            <button className="text-white text-xl font-bold hover:bg-gray-500 p-2 w-1/5 rounded cursor-pointer" onClick={() => router.push("/login")}>Logout</button>
          </ul>
        </nav>
      

    );
}