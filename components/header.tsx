import { useAccount } from "wagmi"
import { ConnectKitButton } from 'connectkit'
import Link from 'next/link';

export default function Header() {
  const account = useAccount()

  return (
    <>
      <noscript>
        <style>{`.nojs-show { opacity: 1; top: 0; }`}</style>
      </noscript>
      <div className='w-full bg-white border-b border-gray-200'>
        <div
          className={`nojs-show`}
        >
            <div className="flex justify-between items-center md:p-4 py-5 max-w-6xl mx-auto">
              <Link href="/" className="flex items-center space-x-2 md:px-0 px-4">
                <h1 className="text-xl md:text-3xl font-bold">
                Citadel. 
                <span className="text-blue-600">
                  OnChain
                </span>
                </h1>
              </Link>
              <div className="flex items-center space-x-2">
                <ConnectKitButton/>
              </div>
            </div>
        </div>
      </div>
    </>
  )
}
