import { useState } from 'react'
import Layout from "@/components/layout"
import { useAccount } from 'wagmi'

export default function StakePage() {
    const [stakedAmount, setStakedAmount] = useState<number>(0)
    const [stakeInput, setStakeInput] = useState<string>('')
    const account = useAccount()

    const handleStake = () => {
        const amount = parseFloat(stakeInput)
        if (!isNaN(amount) && amount > 0) {
            setStakedAmount(prevAmount => prevAmount + amount)
            setStakeInput('')
        }
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Stake Credit Score</h1>
                {account.isConnected ? (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Your Staking Dashboard</h2>
                        <p className="text-lg mb-4">
                            Total Staked Amount: <span className="font-bold">{stakedAmount} ETH</span>
                        </p>
                        <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={stakeInput}
                            onChange={(e) => setStakeInput(e.target.value)}
                            placeholder="Amount to stake"
                            className="border border-gray-300 rounded-md p-2 px-3 flex-grow outline-none"
                        />
                        <button onClick={handleStake} className="button-mint">
                            <span className="button_top-mint">Stake</span>
                        </button>
                        </div>
                    </div>
                    ) : (
                    <p className="text-lg">Please connect your wallet to stake tokens.</p>
                )}
            </div>
        </Layout>
    )
}