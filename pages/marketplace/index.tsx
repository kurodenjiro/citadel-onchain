import { useState, useEffect } from 'react'
import Layout from "@/components/layout"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import abi from '@/lib/ContractAbi.json'
import { toast } from 'react-toastify'

export default function MarketplacePage() {
    const [nfts, setNfts] = useState([])
    const account = useAccount()
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

    const { data: nftData } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getAllNFTs',
    })

    const { writeContractAsync: buyNFT } = useWriteContract()
    const { writeContractAsync: sellNFT } = useWriteContract()

    useEffect(() => {
        if (nftData) {
            setNfts(nftData as any)
        }
    }, [nftData])

    const handleBuy = async (tokenId: number) => {
        try {
            const hash = await buyNFT({
                address: contractAddress,
                abi,
                functionName: 'buyNFT',
                args: [tokenId],
            })
            await useWaitForTransactionReceipt({ hash })
            toast.success('NFT purchased successfully!')
        } catch (error) {
            toast.error('Failed to buy NFT')
        }
    }

    const handleSell = async (tokenId: number, price: string) => {
        try {
            const hash = await sellNFT({
                address: contractAddress,
                abi,
                functionName: 'sellNFT',
                args: [tokenId, price],
            })
            await useWaitForTransactionReceipt({ hash })
            toast.success('NFT listed for sale successfully!')
        } catch (error) {
            toast.error('Failed to list NFT for sale')
        }
    }
    console.log('nfts', nfts)

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">NFTs Marketplace</h1>
                {account.isConnected ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {nfts.map((nft: any, index: number) => (
                            <div key={index} className="bg-white shadow-md rounded-lg p-6 border border-gray-300">
                                <h2 className="text-xl font-semibold mb-4">NFT #{nft.tokenId}</h2>
                                <p className="mb-4">Owner: {nft.owner}</p>
                                <p className="mb-4">Price: {nft.price} ETH</p>
                                {nft.owner.toLowerCase() !== account.address?.toLowerCase() ? (
                                    <button onClick={() => handleBuy(nft.tokenId)} className="button-mint">
                                        <span className="button_top-mint">Buy</span>
                                    </button>
                                ) : (
                                    <button onClick={() => handleSell(nft.tokenId, nft.price)} className="button-mint">
                                        <span className="button_top-mint">Sell</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-lg">Please connect your wallet to view and interact with NFTs.</p>
                )}
            </div>
        </Layout>
    )
}
