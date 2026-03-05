import Link from "next/dist/client/link";

export default function Nav() {
    return (

      

        
        <nav className="w-full bg-gray-600 h-16 text-xl flex items-center text-white font-bold flex p-10 w-full shrink-0">
            <div className="flex items-center space-x-4">
                <Link href="/">Play</Link>
                
            </div>

            <div className="flex md:flex md:flex-grow flex-row justify-end space-x-10">
                <Link href="/profile">Profile</Link>
                <Link href="/login">LogIn</Link>
            </div>
        </nav>
      

    );
}