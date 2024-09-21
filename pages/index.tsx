"use client"
import Layout from "../components/layout"
import abi from '@/lib/ContractAbi.json'
import abiLend from '@/lib/ContractAbiLend.json'
import abiToken from '@/lib/ContractAbiToken.json'
import abiWorldID from '@/lib/abi.json'
import { IDKitWidget, ISuccessResult, useIDKit } from '@worldcoin/idkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, type BaseError, useReadContract } from 'wagmi'
import { decodeAbiParameters, parseAbiParameters } from 'viem'
import { useEffect, useState } from 'react'
import { toast } from'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function IndexPage() {
    const account = useAccount()
    const { setOpen } = useIDKit()
    const [done, setDone] = useState(false)
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = 
      useWaitForTransactionReceipt({
        hash,
    }) 
    const [isMinted, setIsMinted] = useState(false)
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
    const [tokenId, setTokenId] = useState<string | null>(null)
    const [typeSubmit, setTypeSubmit] = useState<string | null>(null)
    const [valueStake, setValueStake] = useState<string | null>(null)

    useEffect(() => {
        const fetchTokenId = async () => {
            if (account.address) {
                const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
                const apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${account.address}&sort=desc&apikey=${apiKey}`

                try {
                    const response = await fetch(apiUrl)
                    const data = await response.json()
                    if (data.status === '1' && data.result.length > 0) {
                        setTokenId(data.result[0].tokenID)
                    } else {
                        setTokenId(null)
                    }
                } catch (error) {
                    console.error('Error fetching token ID:', error)
                    setTokenId(null)
                }
            }
        }

        fetchTokenId()
    }, [account.address, contractAddress])

    const { data: nftType } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'ownerNftType',
        args: tokenId ? [account.address,BigInt(tokenId)] : undefined,
    })

    const { data: canLend } = useReadContract({
      address: '0x925648eFf5A52B6A0Cd9187C1b4A461a2E258aF0',
      abi: abiLend,
      functionName: 'canTakeLoan',
      args:  [account.address!]
    })

    const { data: loanAmount } = useReadContract({
      address: '0x925648eFf5A52B6A0Cd9187C1b4A461a2E258aF0',
      abi: abiLend,
      functionName: 'loanBalanceOf',
      args:  [account.address!]
    })


    useEffect(() => {
        if (nftType == "Netflix subscription") {
          setIsMinted(true)
        }
    }, [nftType])

    const submitTx = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0x7614974e05dc974d21ac2888b4d5d5b49c9c28b7`,
          account: account.address!,
          abi,
          functionName: 'approve',
          args: [
            account.address!,
            BigInt(0)
          ],
        })
        setDone(true)
        toast.success('Mint successful')
      } catch (error) {throw new Error((error as BaseError).shortMessage)}
    }

    const onStake = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0x925648eFf5A52B6A0Cd9187C1b4A461a2E258aF0`,
          account: account.address!,
          abi: abiLend,
          functionName: 'stake',
          args: [],
          value: BigInt(parseFloat(valueStake!)*10**18)
        })
        setDone(true)
        toast.success('Lending successful')
      } catch (error) {throw new Error((error as BaseError).shortMessage)}
    }

    const verifyAndExecute = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0xC49Fe681c8a6e5D332Eb7767703CCe4CB1CdAd4F`,
          account: account.address!,
          abi: abiWorldID,
          functionName: 'verifyAndExecute',
          args: [
            account.address!,
            BigInt(proof!.merkle_root),
            BigInt(proof!.nullifier_hash),
            decodeAbiParameters(
              parseAbiParameters('uint256[8]'),
              proof!.proof as `0x${string}`
            )[0],
          ],
        })
        setDone(true)
      } catch (error) {throw new Error((error as BaseError).shortMessage)}
    }
  

  //console.log('hash',hash)
  return (
    <Layout>
      
      {
        account.isConnected&&
        (
          <IDKitWidget
            app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
            action={process.env.NEXT_PUBLIC_ACTION as string}
            signal={account?.address}
            onSuccess={verifyAndExecute}
            autoClose
          />
        )
      }
      <div className="max-w-6xl mx-auto p-4">
      {
        account?.address && (
          <div className="flex md:flex-row flex-col md:space-x-6 mb-10 gap-5 md:gap-0">
            <div className="bg-white shadow-md rounded-lg p-6 flex-1 flex items-center border border-gray-300">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-8 border-gray-300 flex items-center justify-center text-gray-500 text-4xl font-bold">
                            10
                        </div>
                        <div className="absolute -bottom-4 font-semibold left-[72%] transform text-xs -translate-x-1/2 text-gray-500 w-32 pb-10">
                            credit score
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <img width={20} src="/assets/user.svg" alt="My Humanity Score" />
                            <span className="text-gray-700 font-semibold">My Credit Score</span>
                            {/* <div className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">Verified Human</div> */}
                        </div>
                        <div className="text-gray-500 mt-1">Amount available for loan.</div>
                    </div>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 flex-1 border border-gray-300">
                <div className="flex items-center space-x-2 mb-4">
                    <img width={20} src="/assets/history.svg" alt="Recent Checks" />
                    <span className="text-gray-700 font-semibold">Recent Checks</span>
                    <span className="text-gray-500">0 Total Completed</span>
                </div>
            </div>
        </div> 
        )
      }
      <div className="flex flex-col md:flex-row w-full justify-between gap-5 mb-10">
        {
          account?.address && (
            <div className="border border-gray-300 rounded-lg p-5 shadow-sm w-1/2">
                  <h1 className="text-2xl font-bold mb-6">Stake Credit Score</h1>
                  {account.isConnected && (
                      <div className="">
                          <h2 className="text-xl font-semibold mb-4">Your Staking Dashboard</h2>
                          <p className="text-lg mb-4">
                              Total Staked Amount: <span className="font-bold">0 ETH</span>
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                                onChange={(e)=>setValueStake(e.target.value)}
                                type="text"
                                value={''}
                                placeholder="Amount to stake"
                                className="border border-gray-300 rounded-md p-2 px-3 flex-grow outline-none"
                            />
                          </div>
                          <div className="flex flex-row gap-10 mt-4">
                            <button onClick={()=>setOpen(true)} className="button-mint">
                              <span className="button_top-mint">Stake</span>
                            </button>
                            <button className="border border-orange-300 rounded-md p-2 px-3 cursor-pointer">
                              <span className="text-orange-500 font-semibold">Unstake</span>
                            </button>

                          </div>
                      </div>
                      ) 
                  }
              </div>
          )
        }
        {
          account?.address && (
            <div className="border border-gray-300 rounded-lg p-5 shadow-sm w-1/2">
                  <h1 className="text-2xl font-bold mb-6">Widthdraw Credit Score</h1>
                  {account.isConnected && (
                      <div className="">
                          <h2 className="text-xl font-semibold mb-4">Your Widthdraw Dashboard</h2>
                          <p className="text-lg mb-4">
                              Total Staked Amount: <span className="font-bold">0 ETH</span>
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                                type="text"
                                value={''}
                                placeholder="Amount to widthdraw"
                                className="border border-gray-300 rounded-md p-2 px-3 flex-grow outline-none"
                            />
                            
                          </div>
                          <button className="button-mint mt-4 float-end">
                                <span className="button_top-mint">Widthdraw</span>
                          </button>
                      </div>
                      )}
              </div>
          )
        }
        {
          account?.address && (
            <div className="border border-gray-300 rounded-lg p-5 shadow-sm w-1/2">
                  <h1 className="text-2xl font-bold mb-6">Claim Reward</h1>
                  {account.isConnected && (
                      <div className="relative h-full">
                          <h2 className="text-xl font-semibold mb-4">Your Widthdraw Dashboard</h2>
                          <p className="text-lg mb-4">
                              Total Amount Reward: <span className="font-bold">0 ETH</span>
                          </p>
                          <button className="button-mint mt-4 float-end absolute bottom-14 right-0">
                                <span className="button_top-mint">Claim</span>
                          </button>
                      </div>
                      ) }
              </div>
          )
        }
      </div>
        <section>
          <h2 className="text-3xl font-bold mb-2">
            NFT Credit Score
          </h2>
          <p className="mb-4">
            A unique collection of digital art NFTs that fuse creativity with innovation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-4 justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <h3 className="font-bold">
                      Holonym ZK ID 
                    </h3>
                    <p className="text-sm text-gray-500">
                      verifier.holonym_id.near
                    </p>
                  </div>
                </div>
                <span className="ml-auto text-end font-semibold w-24 text-sm flex flex-col">
                  0.12 ETH <small className="text-gray-500">can lending</small>
                </span>
              </div>
              <p className="text-sm mb-4">
                A private proof of owning a unique government ID. For instructions on how to ...
              </p>
              <div className="flex items-center space-x-2 justify-between border-t py-2 border-gray-300 w-full">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                  <span className="text-sm">
                    holonym_id.near
                  </span>
                </div>
                
                {
                  !done && <button disabled={isPending} onClick={()=>setOpen(true)} className="button-mint mt-1">
                    <span className="button_top-mint">Mint</span>
                </button>
                }
                {
                  done && <button disabled={isPending} onClick={()=>setOpen(true)} className="button-mint mt-1">
                    <span className="button_top-mint">Lending</span>
                </button>
                }
              </div>
            </div> */}
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs border border-gray-200">
                <img 
                    alt="A futuristic, robotic device with a yellow and gray color scheme" 
                    className="rounded-lg border border-gray-200 p-2 transition-transform duration-300 ease-in-out hover:scale-105" 
                    height="400" 
                    src="https://oaidalleapiprodscus.blob.core.windows.net/private/org-BVbpSZmLndA7MfHIxv2ahIKS/user-IBY8IaMXtVn7IVIdZeyvjx16/img-YDDBzyw1YG2Z1SH2CUkNsQgs.png?st=2024-09-21T18%3A50%3A34Z&amp;se=2024-09-21T20%3A50%3A34Z&amp;sp=r&amp;sv=2024-08-04&amp;sr=b&amp;rscd=inline&amp;rsct=image/png&amp;skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&amp;sktid=a48cca56-e6da-484e-a814-9c849652bcb3&amp;skt=2024-09-20T23%3A18%3A54Z&amp;ske=2024-09-21T23%3A18%3A54Z&amp;sks=b&amp;skv=2024-08-04&amp;sig=iD0Vi5LsS4ToCn2ycSHZ9iUh7bbZgW8GUPIcyesAMTM%3D" 
                    width="400"
                />
                <div className="p-4">
                  <div className="text-gray-400 text-sm">
                    verifier.holonym_id.near
                  <i className="fas fa-check-circle text-yellow-500">
                  </i>
                  </div>
                  <div className="text-black text-lg font-bold mt-1">
                    NFT Credit Score
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-gray-400 text-sm">
                      <div className="mt-1">
                      Price
                      </div>
                      <div className="text-black font-bold mt-1">
                      0.023 ETH
                      </div>
                    </div>
                    {
                      !done && !isMinted && <button disabled={isPending} onClick={()=>{
                        setTypeSubmit('mint')
                        setOpen(true)
                      }} className="button-mint mt-4">
                          <span className="button_top-mint">{isConfirming ? 'Pending' : 'Mint'}</span>
                      </button>
                    }
                    {
                      isMinted && <button disabled={isPending} onClick={()=>{
                        setTypeSubmit('lending')
                        setOpen(true)
                      }} className="button-mint mt-4">
                          <span className="button_top-mint">Lending</span>
                      </button>
                    }
                  </div>
                </div>
                </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
